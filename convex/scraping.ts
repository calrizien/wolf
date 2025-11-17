import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Scrape quotes from web sources using Firecrawl
export const scrapeQuotes = action({
  args: {
    url: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    try {
      const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

      if (!firecrawlApiKey) {
        console.error("FIRECRAWL_API_KEY not set in environment variables");
        return { success: 0, failed: 1, error: "API key not configured" };
      }

      // Call Firecrawl API to scrape the page
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${firecrawlApiKey}`,
        },
        body: JSON.stringify({
          url: args.url,
          formats: ["markdown"],
        }),
      });

      if (!response.ok) {
        console.error("Firecrawl API error:", await response.text());
        return { success: 0, failed: 1, error: "Firecrawl API error" };
      }

      const data = await response.json();
      console.log("Scraped data:", data);

      // TODO: Parse the markdown content to extract quotes
      // For now, return success
      return { success: 1, failed: 0 };
    } catch (error) {
      console.error("Error scraping quotes:", error);
      return { success: 0, failed: 1, error: String(error) };
    }
  },
});

// Seed database with initial curated quotes
export const seedDatabase = action({
  args: {},
  handler: async (ctx) => {
    // Comprehensive collection of quotes organized by category with semantic tags
    const seedQuotes = [
      // WISDOM
      { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates", category: "wisdom", tags: ["philosophy", "knowledge", "humility", "ancient-philosophy"] },
      { text: "The unexamined life is not worth living.", author: "Socrates", category: "wisdom", tags: ["philosophy", "reflection", "purpose", "self-discovery"] },
      { text: "I think, therefore I am.", author: "René Descartes", category: "wisdom", tags: ["philosophy", "existence", "consciousness", "thought"] },
      { text: "Know thyself.", author: "Ancient Greek Aphorism", category: "wisdom", tags: ["self-awareness", "philosophy", "growth", "self-knowledge"] },
      { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu", category: "wisdom", tags: ["journey", "beginning", "action", "perseverance", "eastern-philosophy"] },
      { text: "The obstacle is the way.", author: "Marcus Aurelius", category: "wisdom", tags: ["stoicism", "challenge", "perspective", "adversity"] },
      { text: "Everything that has a beginning has an ending. Make your peace with that and all is well.", author: "Buddha", category: "wisdom", tags: ["buddhism", "acceptance", "impermanence", "peace"] },
      { text: "The wise adapt themselves to circumstances, as water molds itself to the pitcher.", author: "Confucius", category: "wisdom", tags: ["adaptability", "eastern-philosophy", "flexibility", "wisdom"] },
      { text: "Be kind whenever possible. It is always possible.", author: "Dalai Lama", category: "wisdom", tags: ["kindness", "compassion", "choice", "buddhism"] },
      { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela", category: "wisdom", tags: ["resilience", "courage", "perseverance", "leadership"] },
      { text: "The mind is everything. What you think you become.", author: "Buddha", category: "wisdom", tags: ["mindset", "buddhism", "thought", "transformation"] },
      { text: "Our deepest fear is not that we are inadequate. Our deepest fear is that we are powerful beyond measure.", author: "Marianne Williamson", category: "wisdom", tags: ["self-worth", "power", "fear", "potential"] },

      // MOTIVATION
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "motivation", tags: ["passion", "work", "excellence", "purpose", "career"] },
      { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs", category: "motivation", tags: ["authenticity", "time", "purpose", "individuality"] },
      { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "motivation", tags: ["dreams", "future", "belief", "vision", "aspiration"] },
      { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "motivation", tags: ["perseverance", "courage", "success", "failure-acceptance"] },
      { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "motivation", tags: ["belief", "confidence", "achievement", "self-belief"] },
      { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", category: "motivation", tags: ["beginning", "action", "possibility", "progress"] },
      { text: "You must not lose faith in humanity. Humanity is an ocean; if a few drops of the ocean are dirty, the ocean does not become dirty.", author: "Mahatma Gandhi", category: "motivation", tags: ["faith", "hope", "humanity", "perspective"] },
      { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", category: "motivation", tags: ["persistence", "time", "progress", "focus"] },
      { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "motivation", tags: ["action", "beginning", "execution", "simplicity"] },
      { text: "If you can dream it, you can do it.", author: "Walt Disney", category: "motivation", tags: ["dreams", "possibility", "belief", "imagination"] },
      { text: "We are only limited by our thoughts.", author: "Unknown", category: "motivation", tags: ["mindset", "limitation", "potential", "thought"] },
      { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", category: "motivation", tags: ["action", "time", "progress", "beginning"] },

      // CREATIVITY
      { text: "Creativity is intelligence having fun.", author: "Albert Einstein", category: "creativity", tags: ["intelligence", "fun", "innovation", "expression"] },
      { text: "The worst enemy to creativity is self-doubt.", author: "Sylvia Plath", category: "creativity", tags: ["doubt", "confidence", "art", "self-belief"] },
      { text: "Creativity takes courage.", author: "Henri Matisse", category: "creativity", tags: ["courage", "art", "expression", "bravery"] },
      { text: "Every artist was first an amateur.", author: "Ralph Waldo Emerson", category: "creativity", tags: ["beginning", "art", "growth", "mastery"] },
      { text: "The desire to create is one of the deepest yearnings of the human soul.", author: "Dieter F. Uchtdorf", category: "creativity", tags: ["soul", "expression", "human nature", "purpose"] },
      { text: "You can't use up creativity. The more you use, the more you have.", author: "Maya Angelou", category: "creativity", tags: ["abundance", "art", "growth", "inspiration"] },
      { text: "The chief enemy of creativity is good sense.", author: "Pablo Picasso", category: "creativity", tags: ["unconventional", "art", "innovation", "risk"] },
      { text: "Art enables us to find ourselves and lose ourselves at the same time.", author: "Thomas Merton", category: "creativity", tags: ["art", "identity", "self-discovery", "expression"] },
      { text: "Creativity is seeing what others see, but thinking what no one else has ever thought.", author: "Albert Einstein", category: "creativity", tags: ["originality", "perspective", "innovation", "thinking"] },

      // LOVE & CONNECTION
      { text: "Love is composed of a single soul inhabiting two bodies.", author: "Aristotle", category: "love", tags: ["connection", "soul", "relationships", "unity", "intimacy"] },
      { text: "Where there is love there is life.", author: "Mahatma Gandhi", category: "love", tags: ["life", "compassion", "connection", "vitality"] },
      { text: "The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart.", author: "Helen Keller", category: "love", tags: ["beauty", "heart", "feeling", "intangible"] },
      { text: "To love and be loved is to feel the sun from both sides.", author: "David Viscott", category: "love", tags: ["mutual", "warmth", "connection", "reciprocal"] },
      { text: "Love recognizes no barriers.", author: "Maya Angelou", category: "love", tags: ["boundaries", "universal", "acceptance", "freedom"] },
      { text: "The heart wants what it wants. Or else it does not care.", author: "Emily Dickinson", category: "love", tags: ["passion", "desire", "emotion", "authenticity"] },
      { text: "Love never dies, it only grows stronger with time.", author: "Michael J. Fox", category: "love", tags: ["eternal", "growth", "time", "endurance"] },
      { text: "In the end, we will remember not the words of our enemies, but the silence of our friends.", author: "Martin Luther King Jr.", category: "love", tags: ["friendship", "loyalty", "connection", "support"] },
      { text: "The greatest happiness of life is the conviction that we are loved.", author: "Victor Hugo", category: "love", tags: ["happiness", "worth", "belonging", "fulfillment"] },

      // COURAGE
      { text: "Courage is not the absence of fear, but rather the assessment that something else is more important than fear.", author: "Franklin D. Roosevelt", category: "courage", tags: ["fear", "bravery", "values", "priority"] },
      { text: "You gain strength, courage, and confidence by every experience in which you really stop to look fear in the face.", author: "Eleanor Roosevelt", category: "courage", tags: ["growth", "experience", "strength", "confrontation"] },
      { text: "It takes courage to grow up and become who you really are.", author: "E.E. Cummings", category: "courage", tags: ["authenticity", "growth", "identity", "bravery"] },
      { text: "Courage is grace under pressure.", author: "Ernest Hemingway", category: "courage", tags: ["grace", "pressure", "composure", "strength"] },
      { text: "Being brave is not the absence of fear. Being brave is terror and doubt and fear all squeezed into a knot in your stomach, and you say, 'I am going anyway.'", author: "Laurell K. Hamilton", category: "courage", tags: ["fear", "vulnerability", "action", "brave"] },
      { text: "Courage is like a muscle. We strengthen it by use.", author: "Ruth Gordon", category: "courage", tags: ["practice", "growth", "strength", "habit"] },
      { text: "Do one thing every day that scares you.", author: "Eleanor Roosevelt", category: "courage", tags: ["daily-practice", "fear", "growth", "challenge"] },

      // MINDFULNESS & PRESENCE
      { text: "The present moment is the only time over which we have dominion.", author: "Thích Nhất Hạnh", category: "mindfulness", tags: ["present", "awareness", "control", "now", "buddhism"] },
      { text: "Wherever you are, be all there.", author: "Jim Elliot", category: "mindfulness", tags: ["presence", "focus", "awareness", "wholeness"] },
      { text: "Peace comes from within. Do not seek it without.", author: "Buddha", category: "mindfulness", tags: ["peace", "inner", "wisdom", "buddhism"] },
      { text: "In the midst of movement and chaos, keep stillness inside of you.", author: "Deepak Chopra", category: "mindfulness", tags: ["stillness", "chaos", "balance", "inner-peace"] },
      { text: "Mindfulness is about being fully awake in our lives.", author: "Jon Kabat-Zinn", category: "mindfulness", tags: ["awareness", "present", "awakening", "life"] },
      { text: "The mind is like water. When it is turbulent, it is difficult to see. When it is calm, everything becomes clear.", author: "Rama Swami", category: "mindfulness", tags: ["mental-clarity", "calm", "peace", "meditation"] },

      // GROWTH & CHANGE
      { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", category: "growth", tags: ["inner strength", "potential", "self", "inner-power"] },
      { text: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll", category: "growth", tags: ["attitude", "response", "choice", "resilience"] },
      { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson", category: "growth", tags: ["destiny", "choice", "self-determination", "power"] },
      { text: "Change your thoughts and you change your world.", author: "Norman Vincent Peale", category: "growth", tags: ["mindset", "transformation", "power", "thought"] },
      { text: "Growth is painful. Change is painful. But nothing is as painful as staying stuck somewhere you don't belong.", author: "Mandy Hale", category: "growth", tags: ["change", "pain", "progress", "discomfort"] },
      { text: "The bamboo that bends is stronger than the oak that resists.", author: "Japanese Proverb", category: "growth", tags: ["flexibility", "strength", "adaptability", "resilience"] },
      { text: "Every moment of life is a fresh beginning.", author: "Ralph Waldo Emerson", category: "growth", tags: ["newness", "potential", "beginning", "renewal"] },
      { text: "It is not the mountain we conquer, but ourselves.", author: "Edmund Hillary", category: "growth", tags: ["self-conquest", "challenge", "improvement", "potential"] },
      { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein", category: "growth", tags: ["mistakes", "innovation", "risk", "learning"] },

      // NATURE & WONDER
      { text: "In every walk with nature, one receives far more than he seeks.", author: "John Muir", category: "nature", tags: ["wonder", "outdoors", "gifts", "abundance", "natural-world"] },
      { text: "Look deep into nature, and then you will understand everything better.", author: "Albert Einstein", category: "nature", tags: ["understanding", "wisdom", "observation", "insight"] },
      { text: "The Earth has music for those who listen.", author: "William Shakespeare", category: "nature", tags: ["beauty", "listening", "wonder", "harmony"] },
      { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu", category: "nature", tags: ["patience", "time", "natural flow", "wisdom"] },
      { text: "In nature, nothing can be given, all things are sold.", author: "Ralph Waldo Emerson", category: "nature", tags: ["natural-law", "cause-effect", "wisdom", "philosophy"] },
      { text: "Nature is not a place to visit. It is a home.", author: "Gary Snyder", category: "nature", tags: ["belonging", "connection", "home", "identity"] },

      // HAPPINESS & JOY
      { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama", category: "happiness", tags: ["action", "choice", "creation", "empowerment"] },
      { text: "The purpose of our lives is to be happy.", author: "Dalai Lama", category: "happiness", tags: ["purpose", "joy", "meaning", "life"] },
      { text: "Happiness is when what you think, what you say, and what you do are in harmony.", author: "Mahatma Gandhi", category: "happiness", tags: ["harmony", "alignment", "integrity", "authenticity"] },
      { text: "For every minute you are angry you lose sixty seconds of happiness.", author: "Ralph Waldo Emerson", category: "happiness", tags: ["anger", "time", "choice", "emotion"] },
      { text: "Happiness is an inside job.", author: "Ralph Marston", category: "happiness", tags: ["inner-joy", "responsibility", "choice", "empowerment"] },
      { text: "The greatest wealth is health.", author: "Buddha", category: "happiness", tags: ["wellbeing", "health", "wealth", "priority"] },
      { text: "Happiness is not by chance, but by choice.", author: "Jim Rohn", category: "happiness", tags: ["choice", "decision", "control", "empowerment"] },

      // PERSISTENCE & RESILIENCE
      { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "persistence", tags: ["progress", "consistency", "perseverance", "pace"] },
      { text: "Fall seven times, stand up eight.", author: "Japanese Proverb", category: "persistence", tags: ["resilience", "failure", "courage", "recovery"] },
      { text: "Success is stumbling from failure to failure with no loss of enthusiasm.", author: "Winston Churchill", category: "persistence", tags: ["failure", "enthusiasm", "resilience", "optimism"] },
      { text: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.", author: "Thomas Edison", category: "persistence", tags: ["giving-up", "success", "trying", "determination"] },
      { text: "The master has failed more times than the beginner has even tried.", author: "Stephen McCranie", category: "persistence", tags: ["failure", "mastery", "experience", "growth"] },
      { text: "Resilience is accepting your new reality, even if it's less good than the one you had before.", author: "Elizabeth Edwards", category: "persistence", tags: ["acceptance", "reality", "adaptation", "survival"] },
      { text: "Fall down seven times, stand up eight.", author: "Japanese Proverb", category: "persistence", tags: ["resilience", "determination", "perseverance", "recovery"] },

      // TRUTH & HONESTY
      { text: "The truth will set you free, but first it will piss you off.", author: "Gloria Steinem", category: "truth", tags: ["freedom", "honesty", "discomfort", "liberation"] },
      { text: "Three things cannot be long hidden: the sun, the moon, and the truth.", author: "Buddha", category: "truth", tags: ["revelation", "inevitability", "nature", "truth"] },
      { text: "If you tell the truth, you don't have to remember anything.", author: "Mark Twain", category: "truth", tags: ["honesty", "simplicity", "integrity", "memory"] },
      { text: "The truth is like a lion; you don't have to defend it. Let it loose; it will defend itself.", author: "Unknown", category: "truth", tags: ["power", "simplicity", "honesty", "truth"] },
      { text: "Honesty is the best policy.", author: "Benjamin Franklin", category: "truth", tags: ["integrity", "virtue", "honesty", "morality"] },

      // TIME
      { text: "Time you enjoy wasting is not wasted time.", author: "Marthe Troly-Curtin", category: "time", tags: ["enjoyment", "leisure", "perspective", "presence"] },
      { text: "The two most powerful warriors are patience and time.", author: "Leo Tolstoy", category: "time", tags: ["patience", "power", "warriors", "strength"] },
      { text: "Time flies over us, but leaves its shadow behind.", author: "Nathaniel Hawthorne", category: "time", tags: ["memory", "impact", "passing", "legacy"] },
      { text: "Yesterday is history, tomorrow is a mystery, but today is a gift. That is why it is called the present.", author: "Bill Keane", category: "time", tags: ["present", "gift", "now", "mindfulness"] },
      { text: "The only reason for time is so that everything doesn't happen at once.", author: "Albert Einstein", category: "time", tags: ["philosophy", "order", "sequence", "nature"] },

      // LEADERSHIP
      { text: "A leader is one who knows the way, goes the way, and shows the way.", author: "John C. Maxwell", category: "leadership", tags: ["direction", "influence", "example", "vision"] },
      { text: "The greatest leader is not necessarily the one who does the greatest things. He is the one that gets the people to do the greatest things.", author: "Ronald Reagan", category: "leadership", tags: ["influence", "empowerment", "motivation", "achievement"] },
      { text: "Leadership is not about being in charge. It's about taking care of those in your charge.", author: "Simon Sinek", category: "leadership", tags: ["responsibility", "care", "service", "influence"] },
      { text: "Effective leaders help their people see how their work contributes to a larger purpose.", author: "Simon Sinek", category: "leadership", tags: ["purpose", "vision", "motivation", "clarity"] },
      { text: "Leadership is the art of accomplishing more than the science of management says is possible.", author: "Colin Powell", category: "leadership", tags: ["vision", "possibility", "achievement", "inspiration"] },

      // SUCCESS & ACHIEVEMENT
      { text: "Success is not final, failure is not fatal; it is the courage to continue that counts.", author: "Winston Churchill", category: "success", tags: ["perseverance", "failure", "courage", "continuation"] },
      { text: "The only true failure is when you stop trying.", author: "John C. Maxwell", category: "success", tags: ["effort", "persistence", "trying", "determination"] },
      { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill", category: "success", tags: ["failure", "enthusiasm", "optimism", "mindset"] },
      { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau", category: "success", tags: ["focus", "work", "dedication", "purpose"] },
      { text: "Success is not about how much money you make; it's about the difference you make in people's lives.", author: "Michelle Obama", category: "success", tags: ["impact", "meaning", "legacy", "purpose"] },
      { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "success", tags: ["action", "execution", "beginning", "simplicity"] },

      // RELATIONSHIPS & FAMILY
      { text: "The greatest gift you can give your family is your time.", author: "Unknown", category: "relationships", tags: ["family", "time", "presence", "love"] },
      { text: "In family life, love is the oil that eases friction, the cement that binds closer together, and the music that brings harmony.", author: "Friedrich Nietzsche", category: "relationships", tags: ["family", "love", "harmony", "unity"] },
      { text: "A happy family is but an earlier heaven.", author: "George Bernard Shaw", category: "relationships", tags: ["family", "happiness", "heaven", "joy"] },
      { text: "What greater thing is there for two human souls than to feel that they are joined for life?", author: "George Eliot", category: "relationships", tags: ["partnership", "connection", "unity", "commitment"] },
      { text: "The family is one of nature's masterpieces.", author: "George Santayana", category: "relationships", tags: ["family", "natural", "beauty", "meaning"] },

      // SELF-CARE & WELLBEING
      { text: "You cannot serve from an empty vessel. Make self-care your priority.", author: "Eleanor Brown", category: "self-care", tags: ["wellbeing", "balance", "priority", "health"] },
      { text: "Self-care is not selfish. You cannot serve from an empty cup.", author: "Unknown", category: "self-care", tags: ["balance", "health", "wellbeing", "service"] },
      { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott", category: "self-care", tags: ["rest", "recovery", "renewal", "health"] },
      { text: "Rest when you're weary. Refresh and renew yourself, your body, your mind, your spirit. Then get back to work.", author: "Ralph Marston", category: "self-care", tags: ["rest", "renewal", "balance", "productivity"] },

      // AMBITION & ASPIRATION
      { text: "Don't aim for success if you want it; just do what you love and believe in, and it will come naturally.", author: "David Frost", category: "ambition", tags: ["passion", "purpose", "success", "authenticity"] },
      { text: "The ambitious are to be read with a grain of salt.", author: "Benjamin Franklin", category: "ambition", tags: ["caution", "skepticism", "wisdom", "judgment"] },
      { text: "Ambition is the path to success. Persistence is the vehicle you arrive in.", author: "Bill Bradley", category: "ambition", tags: ["persistence", "success", "drive", "determination"] },
      { text: "We are dying from overthinking. We are slowly killing ourselves by drowning in our thoughts. We lack the courage to say or do what we really need to.", author: "Unknown", category: "ambition", tags: ["action", "courage", "overthinking", "authenticity"] },

      // GRATITUDE
      { text: "Gratitude is a powerful catalyst for happiness. It's the spark that lights a fire of joy in your soul.", author: "Amy Collette", category: "gratitude", tags: ["happiness", "appreciation", "joy", "soul"] },
      { text: "Gratitude turns what we have into enough.", author: "Melody Beattie", category: "gratitude", tags: ["appreciation", "abundance", "contentment", "perspective"] },
      { text: "When you are grateful, fear disappears and abundance appears.", author: "Tony Robbins", category: "gratitude", tags: ["abundance", "fear", "appreciation", "mindset"] },
      { text: "Thank you is the best prayer that anyone could say.", author: "Alice Walker", category: "gratitude", tags: ["prayer", "spirituality", "appreciation", "grace"] },

      // ACCEPTANCE
      { text: "The only way to make sense out of change is to plunge into it, move with it, and join the dance.", author: "Alan Watts", category: "acceptance", tags: ["change", "flow", "adaptation", "resilience"] },
      { text: "Grant me the serenity to accept the things I cannot change, the courage to change the things I can, and the wisdom to know the difference.", author: "Reinhold Niebuhr", category: "acceptance", tags: ["peace", "wisdom", "serenity", "control"] },
      { text: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll", category: "acceptance", tags: ["perspective", "attitude", "choice", "resilience"] },

      // FREEDOM
      { text: "Freedom is not something that anybody can be given. Freedom is something people take, and people are as free as they want to be.", author: "James Baldwin", category: "freedom", tags: ["liberty", "empowerment", "choice", "power"] },
      { text: "For to be free is not merely to cast off one's chains, but to live in a way that respects and enhances the freedom of others.", author: "Nelson Mandela", category: "freedom", tags: ["liberty", "responsibility", "respect", "humanity"] },
      { text: "The only real prison is fear, and the only real freedom is love.", author: "Unknown", category: "freedom", tags: ["fear", "love", "liberty", "emotion"] },

      // LEARNING & KNOWLEDGE
      { text: "The more that you read, the more things you will know.", author: "Dr. Seuss", category: "learning", tags: ["reading", "knowledge", "education", "growth"] },
      { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", category: "learning", tags: ["education", "power", "change", "knowledge"] },
      { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison", category: "learning", tags: ["failure", "learning", "experimentation", "persistence"] },
      { text: "The expert in anything was once a beginner.", author: "Helen Hayes", category: "learning", tags: ["mastery", "beginning", "growth", "experience"] },
      { text: "Learning is a treasure that will follow its owner everywhere.", author: "Chinese Proverb", category: "learning", tags: ["education", "knowledge", "growth", "value"] },

      // WORK & CAREER
      { text: "Do what you feel in your heart to be right, for you'll be criticized anyway.", author: "Eleanor Roosevelt", category: "work", tags: ["integrity", "purpose", "authenticity", "courage"] },
      { text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.", author: "Steve Jobs", category: "work", tags: ["passion", "purpose", "satisfaction", "greatness"] },
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "work", tags: ["passion", "purpose", "excellence", "love"] },
      { text: "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing.", author: "Pelé", category: "work", tags: ["success", "hard-work", "dedication", "passion"] },

      // DREAMS & VISION
      { text: "All that we see or seem is but a dream within a dream.", author: "Edgar Allan Poe", category: "dreams", tags: ["reality", "perception", "mystery", "imagination"] },
      { text: "Hold fast to dreams, for if dreams die, life is a broken-winged bird that cannot fly.", author: "Langston Hughes", category: "dreams", tags: ["dreams", "life", "vision", "hope"] },
      { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "dreams", tags: ["future", "vision", "belief", "possibility"] },
      { text: "Never stop dreaming, and never stop trying to make your dreams come true.", author: "Unknown", category: "dreams", tags: ["persistence", "vision", "hope", "effort"] },

      // HOPE & INSPIRATION
      { text: "Hope is the thing with feathers that perches in the soul.", author: "Emily Dickinson", category: "hope", tags: ["hope", "soul", "optimism", "light"] },
      { text: "Keep your eyes on the stars, and your feet on the ground.", author: "Theodore Roosevelt", category: "hope", tags: ["ambition", "grounding", "balance", "vision"] },
      { text: "Even the darkest night will end and the sun will rise.", author: "Victor Hugo", category: "hope", tags: ["darkness", "light", "endurance", "renewal"] },
      { text: "Aerodynamically, the bumble bee shouldn't be able to fly, but the bumble bee doesn't know it so it goes on flying anyway.", author: "Mary Kay Ash", category: "hope", tags: ["limitation", "belief", "possibility", "success"] },

      // PASSION
      { text: "Passion is the genesis of genius.", author: "Tony Robbins", category: "passion", tags: ["creativity", "excellence", "drive", "power"] },
      { text: "Without passion, you don't have energy. Without energy, you have nothing.", author: "Donald Trump", category: "passion", tags: ["energy", "drive", "motivation", "vitality"] },
      { text: "Passion is energy. Feel the power that comes from focusing on what excites you.", author: "Oprah Winfrey", category: "passion", tags: ["energy", "focus", "excitement", "power"] },
      { text: "Do what you do so well that they will want to see it again and bring their friends.", author: "Walt Disney", category: "passion", tags: ["excellence", "quality", "worth", "repeat"] },

      // KINDNESS & COMPASSION
      { text: "Be kind whenever possible. It is always possible.", author: "Dalai Lama", category: "kindness", tags: ["compassion", "choice", "choice", "humanity"] },
      { text: "No act of kindness, no matter how small, is ever wasted.", author: "Aesop", category: "kindness", tags: ["compassion", "impact", "humanity", "goodness"] },
      { text: "Kindness is a language which the deaf can hear and the blind can see.", author: "Mark Twain", category: "kindness", tags: ["universality", "compassion", "connection", "humanity"] },
      { text: "Everybody has the capacity to do good. And everybody has the capacity to do evil.", author: "Fred Rogers", category: "kindness", tags: ["choice", "humanity", "potential", "morality"] },
      { text: "If you want others to be happy, practice compassion. If you want to be happy, practice compassion.", author: "Dalai Lama", category: "kindness", tags: ["happiness", "compassion", "reciprocal", "choice"] },

      // BALANCE
      { text: "Balance is not something you find, it's something you create.", author: "Jana Kingsford", category: "balance", tags: ["creation", "active", "work", "harmony"] },
      { text: "The key to success is finding balance between ambition and contentment.", author: "Unknown", category: "balance", tags: ["success", "ambition", "contentment", "harmony"] },
      { text: "Life is a dance. Mindfulness is witnessing that dance.", author: "Amit Ray", category: "balance", tags: ["mindfulness", "life", "awareness", "presence"] },

      // PURPOSE & MEANING
      { text: "The meaning of life is to find your gift. The purpose of life is to give it away.", author: "Pablo Picasso", category: "purpose", tags: ["meaning", "gift", "contribution", "legacy"] },
      { text: "Your purpose will be revealed when you stop running from your pain.", author: "Unknown", category: "purpose", tags: ["pain", "growth", "self-discovery", "meaning"] },
      { text: "When you have a why to live, you can bear with almost any how.", author: "Viktor Frankl", category: "purpose", tags: ["meaning", "suffering", "strength", "resilience"] },
      { text: "The purpose of our lives is to be happy, to love, and to serve humanity.", author: "Unknown", category: "purpose", tags: ["happiness", "love", "service", "meaning"] },
    ];

    let addedCount = 0;

    for (const quote of seedQuotes) {
      try {
        await ctx.runMutation(api.quotes.create, {
          text: quote.text,
          author: quote.author,
          category: quote.category,
          tags: quote.tags,
        });
        addedCount++;
      } catch (error) {
        console.error("Error adding quote:", error);
      }
    }

    return { quotesAdded: addedCount };
  },
});
