import { configureStore } from "@reduxjs/toolkit";
import { sampleService } from "./services/sampleService";
import { matterService } from "./services/matterService";

export const store = configureStore({
  reducer: {
    [sampleService.reducerPath]: sampleService.reducer,
    [matterService.reducerPath]: matterService.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({}).concat(
      sampleService.middleware,
      matterService.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
