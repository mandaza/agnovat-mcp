/**
 * Test script to manually create a user and verify stakeholder creation
 * Run with: node test-user-creation.js
 */

import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.CONVEX_URL);

async function testUserCreation() {
  console.log("Testing user creation with stakeholder auto-generation...\n");

  try {
    // Test data
    const testUser = {
      clerk_id: `test_${Date.now()}`,
      email: "test@example.com",
      name: "Test User",
      role: "support_worker",
    };

    console.log("Creating user:", testUser);

    // Call the upsertUser mutation
    const result = await client.mutation("users:upsertUser", testUser);

    console.log("\n✅ User created with ID:", result);

    // Fetch the user with stakeholder details
    const userWithStakeholder = await client.query("users:getUserWithStakeholder", {
      user_id: result,
    });

    console.log("\n📊 User Details:");
    console.log(JSON.stringify(userWithStakeholder, null, 2));

    if (userWithStakeholder.stakeholder) {
      console.log("\n✅ SUCCESS! Stakeholder was auto-created:");
      console.log("  - Stakeholder ID:", userWithStakeholder.stakeholder.id);
      console.log("  - Stakeholder Name:", userWithStakeholder.stakeholder.name);
      console.log("  - Stakeholder Role:", userWithStakeholder.stakeholder.role);
    } else {
      console.log("\n❌ FAILED! No stakeholder was created");
      console.log("User record:", userWithStakeholder);
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
  }
}

testUserCreation();
