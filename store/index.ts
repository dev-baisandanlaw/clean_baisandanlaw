import { configureStore } from "@reduxjs/toolkit";
import { matterService } from "./services/matterService";
import { userService } from "./services/userService";
import { noteService } from "./services/noteService";
import { retainerService } from "./services/retainerService";
import { bookingService } from "./services/bookingService";
import { clientRequestService } from "./services/clientRequestService";
import { documentService } from "./services/documentService";

export const store = configureStore({
  reducer: {
    [matterService.reducerPath]: matterService.reducer,
    [retainerService.reducerPath]: retainerService.reducer,
    [userService.reducerPath]: userService.reducer,
    [noteService.reducerPath]: noteService.reducer,
    [bookingService.reducerPath]: bookingService.reducer,
    [clientRequestService.reducerPath]: clientRequestService.reducer,
    [documentService.reducerPath]: documentService.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({}).concat(
      matterService.middleware,
      retainerService.middleware,
      userService.middleware,
      noteService.middleware,
      bookingService.middleware,
      clientRequestService.middleware,
      documentService.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
