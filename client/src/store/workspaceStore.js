import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const useWorkspaceStore = create((set, get) => {
  let autosaveTimeout = null;
  let socket = null;

  return {
    submissionId: null,
    task: null,
    status: 'not-started',
    workspaceState: {}, // coding: { files, activeFile }, writing: { content }
    aiFeedback: null, // { score, summary, issues: [] }
    testResults: null, // { status, stdout, stderr }
    timeElapsed: 0,
    isSaving: false,
    isRunningCode: false,
    isSubmitting: false,
    socketConnected: false,

    // Initialize workspace and connect socket
    initWorkspace: async (submissionId) => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch submission details
        const response = await axios.get(`/api/tasks/submissions/${submissionId}`, { headers });
        const submission = response.data;

        set({
          submissionId,
          task: submission.task,
          status: submission.status,
          workspaceState: submission.workspaceState || {},
          timeElapsed: submission.analytics?.timeTaken || 0,
          testResults: submission.testResults,
          aiFeedback: submission.aiFeedbackHistory?.[submission.aiFeedbackHistory.length - 1] || null
        });

        // Initialize Socket.io Connection
        const socketHost = window.location.origin.includes('5173')
          ? 'http://localhost:5000'
          : window.location.origin;

        socket = io(socketHost);

        socket.on('connect', () => {
          set({ socketConnected: true });
          socket.emit('joinSubmissionRoom', submissionId);
        });

        socket.on('disconnect', () => {
          set({ socketConnected: false });
        });

        // Hear back async Tier 2 semantic updates
        socket.on('aiFeedbackUpdate', (feedback) => {
          set({ aiFeedback: feedback });
        });

        // Hear other workspace events
        socket.on('reviewed', ({ submission: updatedSub }) => {
          set({ status: updatedSub.status });
        });

      } catch (error) {
        console.error('Failed to initialize workspace store:', error);
      }
    },

    // Update file content (Coding)
    updateFile: (filename, content) => {
      const { workspaceState, submissionId, status } = get();
      const updatedFiles = { ...(workspaceState.files || {}), [filename]: content };
      const newState = { ...workspaceState, files: updatedFiles };

      set({ workspaceState: newState });

      // Emit keystroke to Socket
      if (socket && socket.connected) {
        socket.emit('candidateKeystroke', {
          submissionId,
          workspaceState: newState
        });
        socket.emit('activityStateChange', {
          submissionId,
          activityState: 'working'
        });
      }

      // Trigger debounced autosave
      get().scheduleAutosave();
    },

    // Update rich-text content (Writing)
    updateWritingContent: (content) => {
      const { workspaceState, submissionId } = get();
      const newState = { ...workspaceState, content };

      set({ workspaceState: newState });

      // Emit keystroke to Socket
      if (socket && socket.connected) {
        socket.emit('candidateKeystroke', {
          submissionId,
          workspaceState: newState
        });
        socket.emit('activityStateChange', {
          submissionId,
          activityState: 'working'
        });
      }

      // Trigger debounced autosave
      get().scheduleAutosave();
    },

    // Set Active File selection
    setActiveFile: (activeFile) => {
      const { workspaceState } = get();
      const newState = { ...workspaceState, activeFile };
      set({ workspaceState: newState });
    },

    // Schedule debounced autosave
    scheduleAutosave: () => {
      if (autosaveTimeout) clearTimeout(autosaveTimeout);

      set({ isSaving: true });

      autosaveTimeout = setTimeout(async () => {
        await get().saveWorkspace();
      }, 2500); // 2.5 second debounce after candidate stops typing
    },

    // Save workspace to API
    saveWorkspace: async () => {
      const { submissionId, workspaceState, timeElapsed } = get();
      if (!submissionId) return;

      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.put(
          `/api/tasks/submissions/${submissionId}/autosave`,
          { workspaceState, timeElapsed },
          { headers }
        );

        // Immediate Tier 1 feedback results
        const { tier1Feedback, status: newStatus } = response.data;
        
        // Show Tier 1 feedback immediately while waiting for async Tier 2 socket push
        set({
          status: newStatus,
          isSaving: false,
          aiFeedback: tier1Feedback
        });

        // Notify socket idle
        if (socket && socket.connected) {
          socket.emit('activityStateChange', {
            submissionId,
            activityState: 'idle'
          });
        }
      } catch (error) {
        console.error('Workspace autosave failed:', error);
        set({ isSaving: false });
      }
    },

    // Run Code compiling
    runCode: async () => {
      const { submissionId, workspaceState } = get();
      if (!submissionId) return;

      set({ isRunningCode: true });
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Send a runner execution request
        const response = await axios.post(
          `/api/tasks/submissions/${submissionId}/run`,
          { workspaceState },
          { headers }
        );

        set({
          testResults: response.data.testResults,
          isRunningCode: false
        });
      } catch (error) {
        console.error('Failed to run code compilation:', error);
        set({ isRunningCode: false });
      }
    },

    // Finalize submission
    submitTask: async () => {
      const { submissionId } = get();
      if (!submissionId) return;

      set({ isSubmitting: true });
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.post(
          `/api/tasks/submissions/${submissionId}/submit`,
          {},
          { headers }
        );

        set({
          status: response.data.submission.status,
          isSubmitting: false
        });
        return true;
      } catch (error) {
        console.error('Final task submission failed:', error);
        set({ isSubmitting: false });
        return false;
      }
    },

    incrementTime: () => {
      set((state) => ({ timeElapsed: state.timeElapsed + 1 }));
    },

    cleanupWorkspace: () => {
      if (autosaveTimeout) clearTimeout(autosaveTimeout);
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      set({
        submissionId: null,
        task: null,
        status: 'not-started',
        workspaceState: {},
        aiFeedback: null,
        testResults: null,
        timeElapsed: 0,
        isSaving: false,
        isRunningCode: false,
        isSubmitting: false,
        socketConnected: false
      });
    }
  };
});

export default useWorkspaceStore;
