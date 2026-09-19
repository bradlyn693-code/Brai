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
];

const uploadedFemalePhotos = [
  "/profiles/julia.jpeg",
  "/profiles/pauline.jpeg",
  "/profiles/natalie.jpeg",
];
const uploadedMalePhotos = [
  "/profiles/jayden.png",
  "/profiles/kyle.jpeg",
  "/profiles/gabriel.jpeg",
];

const imagesFor = (url: string) => [url, crop(url, 900), crop(url, 1100, "faces")];

const details = [
  ["Julia", 27, "Nairobi", "Product designer", "Soft life, big dreams, and a camera roll full of Nairobi sunsets.", ["Coffee", "Design", "Travel", "Live music"]],
  ["Pauline", 24, "Lagos", "Creative director", "Lagos energy, good food, and the kind of laughter that makes everyone join in.", ["Foodie", "Fashion", "Afrobeats", "Beach days"]],
  ["Natalie", 22, "Accra", "Architect", "Designing bright spaces and collecting tiny reasons to be grateful.", ["Architecture", "Art", "Books", "Road trips"]],
  ["Jayden", 22, "Addis Ababa", "Illustrator", "Colour, coffee, and conversations that wander somewhere beautiful.", ["Illustration", "Coffee", "Museums", "Dancing"]],
  ["Kyle", 34, "Abuja", "UX researcher", "Give me a good playlist, a plate of jollof, and a reason to stay out longer.", ["Tech", "Jollof", "Podcasts", "Running"]],
  ["Gabriel", 26, "Accra", "Marine biologist", "Ocean air, curious questions, and finding magic in the details.", ["Ocean life", "Cooking", "Photography", "Dancing"]],
] as const;

export const africanProfiles: AfricanProfile[] = details.map(([name, age, city, role, bio, interests], index) => ({
  id: index + 1,
  name,
  gender: index < 3 ? "female" : "male",
  age,
  city,
  distance: [4, 7, 11, 21, 26, 31][index],
  role,
  bio,
  interests: [...interests],
  verified: index % 4 !== 3,
  online: index % 3 !== 2,
  images: index < 3 ? [uploadedFemalePhotos[index]] : [uploadedMalePhotos[index - 3]],
  match: 88 + ((index * 3) % 9),
}));

export const profileFallback = sourcePhotos[0];
