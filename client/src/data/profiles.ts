export type AfricanProfile = {
  id: number;
  name: string;
  age: number;
  city: string;
  distance: number;
  role: string;
  bio: string;
  interests: string[];
  verified: boolean;
  online: boolean;
  images: string[];
  match: number;
  gender: "male" | "female";
};

const crop = (url: string, height: number, position = "face") => `${url}&w=800&h=${height}&fit=crop&crop=${position}`;

const sourcePhotos = [
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&h=1000&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=800&h=1000&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&h=1000&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=1000&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=800&h=1000&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&h=1000&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=1000&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&h=1000&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=1000&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=1000&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&h=1000&fit=crop&crop=face",
];

const imagesFor = (url: string) => [url, crop(url, 900), crop(url, 1100, "faces")];

const details = [
  ["Amara", 23, "Nairobi", "Product designer", "Soft life, big dreams, and a camera roll full of Nairobi sunsets.", ["Coffee", "Design", "Travel", "Live music"]],
  ["Zainab", 24, "Lagos", "Creative director", "Lagos energy, good food, and the kind of laughter that makes everyone join in.", ["Foodie", "Fashion", "Afrobeats", "Beach days"]],
  ["Aisha", 22, "Accra", "Architect", "Designing bright spaces and collecting tiny reasons to be grateful.", ["Architecture", "Art", "Books", "Road trips"]],
  ["Nia", 25, "Kigali", "Founder", "Kigali mornings, thoughtful conversations, and a soft spot for kindness.", ["Entrepreneurship", "Hiking", "Tea", "Wellness"]],
  ["Fatima", 21, "Mombasa", "Travel writer", "Salt in my hair, a notebook in my bag, and always one more place to explore.", ["Writing", "Beach days", "Languages", "Film"]],
  ["Keisha", 26, "Johannesburg", "DJ and producer", "If the beat is right, I am probably dancing. Looking for someone warm and honest.", ["Music", "Vinyl", "Travel", "Street food"]],
  ["James", 27, "Addis Ababa", "Illustrator", "Colour, coffee, and conversations that wander somewhere beautiful.", ["Illustration", "Coffee", "Museums", "Dancing"]],
  ["Daniel", 29, "Abuja", "UX researcher", "Give me a good playlist, a plate of jollof, and a reason to stay out longer.", ["Tech", "Jollof", "Podcasts", "Running"]],
  ["Kwame", 28, "Accra", "Marine biologist", "Ocean air, curious questions, and finding magic in the details.", ["Ocean life", "Cooking", "Photography", "Dancing"]],
  ["Tunde", 30, "Kampala", "Community lead", "Big on kindness, long lunches, and making people feel at home.", ["Community", "Brunch", "Gardening", "Travel"]],
  ["Malik", 26, "Cape Town", "Brand strategist", "A good view, a thoughtful playlist, and a reason to laugh every day.", ["Branding", "Hiking", "Photography", "Wine tasting"]],
  ["Themba", 28, "Nairobi", "Marketing specialist", "Always planning the next adventure and the best meal after it.", ["Travel", "Wellness", "Books", "Cooking"]],
] as const;

export const africanProfiles: AfricanProfile[] = details.map(([name, age, city, role, bio, interests], index) => ({
  id: index + 1,
  name,
  gender: index < 6 ? "female" : "male",
  age,
  city,
  distance: [4, 7, 11, 9, 13, 18, 21, 26, 31, 34, 16, 6][index],
  role,
  bio,
  interests: [...interests],
  verified: index % 4 !== 3,
  online: index % 3 !== 2,
  images: imagesFor(sourcePhotos[index]),
  match: 88 + ((index * 3) % 9),
}));

export const profileFallback = sourcePhotos[0];
