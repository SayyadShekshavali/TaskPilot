export const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return {};
    }
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Failed to parse stored user:', error);
    // Clear corrupted state
    localStorage.removeItem('user');
    return {};
  }
};

export const getStoredToken = () => {
  const token = localStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  return token;
};
