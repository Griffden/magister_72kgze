/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as _internal_chats from "../_internal/chats.js";
import type * as _internal_memory from "../_internal/memory.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as chatDeletion from "../chatDeletion.js";
import type * as chats from "../chats.js";
import type * as feedback from "../feedback.js";
import type * as http from "../http.js";
import type * as mentors from "../mentors.js";
import type * as router from "../router.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "_internal/chats": typeof _internal_chats;
  "_internal/memory": typeof _internal_memory;
  admin: typeof admin;
  auth: typeof auth;
  chatDeletion: typeof chatDeletion;
  chats: typeof chats;
  feedback: typeof feedback;
  http: typeof http;
  mentors: typeof mentors;
  router: typeof router;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
