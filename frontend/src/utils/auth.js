export const login = () => {
  localStorage.setItem("isLoggedIn", "true");
};

export const logout = () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
};

export const isAuthenticated = () => {
  return localStorage.getItem("isLoggedIn") === "true" && Boolean(localStorage.getItem("token"));
};