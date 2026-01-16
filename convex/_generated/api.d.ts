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
import type * as admin from "../admin.js";
import type * as aiRecommendations from "../aiRecommendations.js";
import type * as migrations from "../migrations.js";
import type * as preferences from "../preferences.js";
import type * as repositories from "../repositories.js";
import type * as staffPicks from "../staffPicks.js";
import type * as trending from "../trending.js";
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
  admin: typeof admin;
  aiRecommendations: typeof aiRecommendations;
  migrations: typeof migrations;
  preferences: typeof preferences;
  repositories: typeof repositories;
  staffPicks: typeof staffPicks;
  trending: typeof trending;
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
