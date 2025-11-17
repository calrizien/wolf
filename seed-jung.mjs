import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://keen-bullfrog-361.convex.cloud");

async function seedJungQuotes() {
  try {
    console.log("Starting to seed Carl Jung quotes...");
    const result = await client.action("jungSeed:seedJungQuotes");
    console.log("Seeding complete!");
    console.log("Results:", result);
  } catch (error) {
    console.error("Error seeding quotes:", error);
    process.exit(1);
  }
}

seedJungQuotes();
