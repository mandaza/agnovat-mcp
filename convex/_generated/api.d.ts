/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as activitySessions from "../activitySessions.js";
import type * as auth from "../auth.js";
import type * as behaviorIncidents from "../behaviorIncidents.js";
import type * as clerk from "../clerk.js";
import type * as clients from "../clients.js";
import type * as dashboard from "../dashboard.js";
import type * as debug from "../debug.js";
import type * as goals from "../goals.js";
import type * as http from "../http.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_validation from "../lib/validation.js";
import type * as migrations_fixShiftNoteLinks from "../migrations/fixShiftNoteLinks.js";
import type * as mutations from "../mutations.js";
import type * as queries from "../queries.js";
import type * as shiftNotes from "../shiftNotes.js";
import type * as stakeholders from "../stakeholders.js";
import type * as testActivitySession from "../testActivitySession.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  activitySessions: typeof activitySessions;
  auth: typeof auth;
  behaviorIncidents: typeof behaviorIncidents;
  clerk: typeof clerk;
  clients: typeof clients;
  dashboard: typeof dashboard;
  debug: typeof debug;
  goals: typeof goals;
  http: typeof http;
  "lib/permissions": typeof lib_permissions;
  "lib/validation": typeof lib_validation;
  "migrations/fixShiftNoteLinks": typeof migrations_fixShiftNoteLinks;
  mutations: typeof mutations;
  queries: typeof queries;
  shiftNotes: typeof shiftNotes;
  stakeholders: typeof stakeholders;
  testActivitySession: typeof testActivitySession;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
