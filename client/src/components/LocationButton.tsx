import { useState } from "react";

type LocationData = {
  lat: number;
  lng: number;
  city: string;
  country: string;
  address: string;
};

type LocationButtonProps = {
  onLocation: (location: LocationData) => void;
};

export default function LocationButton({ onLocation }: LocationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getLocation = () => {
    setLoading(true);
    setError("");
    if (!navigator.geolocation) {
      setError("Your device does not support location.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        if (!response.ok) throw new Error("Location service unavailable.");
        const data = await response.json() as { city?: string; locality?: string; principalSubdivision?: string; countryName?: string };
        const city = data.city || data.locality || data.principalSubdivision || "Nairobi";
        const country = data.countryName || "Kenya";
        const location = { lat, lng, city, country, address: `${city}, ${country}` };
        localStorage.setItem("couplehearts_location", JSON.stringify(location));
        localStorage.setItem("user_city", city);
        onLocation(location);
      } catch (locationError) {
        setError(locationError instanceof Error ? locationError.message : "Unable to determine your city.");
      } finally {
        setLoading(false);
      }
    }, (geolocationError) => {
      setError(`Please allow location: ${geolocationError.message}`);
      setLoading(false);
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  return <div className="location-button-wrap">
    <button type="button" onClick={getLocation} className="location-button" disabled={loading}>
      <span aria-hidden="true">📍</span> {loading ? "Finding your location..." : "Use my current location"}
    </button>
    {error && <small className="location-error" role="alert">{error}</small>}
  </div>;
}
