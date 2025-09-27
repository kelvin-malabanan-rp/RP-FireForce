import axios from "axios";

const apiManager = axios.create();
// TO DO - make sure to remove all console.logs in production build
const enableLogs = true;

if (enableLogs) {
  apiManager.interceptors.request.use((request) => {
    return request;
  });

  apiManager.interceptors.response.use((response) => {
    return response;
  });
}

// apiManager.interceptors.request.use(
//   async (config) => {
//     const user = await retrieveUserSession();
//     if (user && user.token) {
//       const token = user.token;
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

export default apiManager;
