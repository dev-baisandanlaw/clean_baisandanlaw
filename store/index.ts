import { configureStore } from "@reduxjs/toolkit";
import { sampleService } from "./services/sampleService";
import { matterService } from "./services/matterService";
import { userService } from "./services/userService";
import { noteService } from "./services/noteService";
import { retainerService } from "./services/retainerService";

export const store = configureStore({
  reducer: {
    [sampleService.reducerPath]: sampleService.reducer,
    [matterService.reducerPath]: matterService.reducer,
    [retainerService.reducerPath]: retainerService.reducer,
    [userService.reducerPath]: userService.reducer,
    [noteService.reducerPath]: noteService.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({}).concat(
      sampleService.middleware,
      matterService.middleware,
      retainerService.middleware,
      userService.middleware,
      noteService.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
