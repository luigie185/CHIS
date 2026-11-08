import { date, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { userStatus } from "./enums";
import { barangays } from "./lookups";

export const staffProfiles = pgTable("staff_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  phone: varchar("phone", { length: 13 }),
  purok: text("purok"),
  barangayId: integer("barangay_id").references(() => barangays.id),
  city: text("city"),
  prcNumber: text("prc_number"),
  prcValidity: date("prc_validity"),
  specialization: text("specialization"),
  status: userStatus("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
