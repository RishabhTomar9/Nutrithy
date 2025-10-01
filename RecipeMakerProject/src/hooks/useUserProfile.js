// src/hooks/useUserProfile.js
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { useAuth } from "./useAuth";

export function useUserProfile(userData, userDataLoading, userDataError) {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
    interests: "",
    dietaryPreferences: "",
    allergies: "",
    cookingExperience: "",
    favoriteIngredients: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Initialize edit form from profile data
  const initializeEditForm = (profileData) => {
    setEditForm({
      name: profileData.name || profileData.displayName || "",
      bio: profileData.bio || "",
      location: profileData.location || "",
      website: profileData.website || "",
      interests: profileData.interests?.join(", ") || "",
      dietaryPreferences: profileData.dietaryPreferences?.join(", ") || "",
      allergies: profileData.allergies?.join(", ") || "",
      cookingExperience: profileData.cookingExperience || "",
      favoriteIngredients: profileData.favoriteIngredients?.join(", ") || "",
    });
    setProfileImagePreview(profileData.photoURL || profileData.photo || null);
  };

  // Handle profile image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  // Format list inputs (CSV → array)
  const formatList = (input) =>
    input ? input.split(",").map((i) => i.trim()).filter(Boolean) : [];

  // Save profile updates
  const saveProfileChanges = async () => {
    try {
      setSaving(true);
      setError(null);

      const formData = new FormData();
      formData.append("displayName", editForm.name);
      formData.append("bio", editForm.bio);
      formData.append("location", editForm.location);
      formData.append("website", editForm.website);
      formData.append("interests", JSON.stringify(formatList(editForm.interests)));
      formData.append("dietaryPreferences", JSON.stringify(formatList(editForm.dietaryPreferences)));
      formData.append("allergies", JSON.stringify(formatList(editForm.allergies)));
      formData.append("cookingExperience", editForm.cookingExperience);
      formData.append("favoriteIngredients", JSON.stringify(formatList(editForm.favoriteIngredients)));
      
      // Always include the current Firebase photoURL if available
      if (currentUser?.photoURL) {
        formData.append("photoURL", currentUser.photoURL);
      }

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const endpoint = userId ? `/api/users/${userId}/profile` : `/api/users/profile`;
      const { data } = await axiosInstance.put(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update profile state locally
      setProfile((prev) => ({
        ...prev,
        ...data,
        name: editForm.name,
        bio: editForm.bio,
        location: editForm.location,
        website: editForm.website,
        interests: formatList(editForm.interests),
        dietaryPreferences: formatList(editForm.dietaryPreferences),
        allergies: formatList(editForm.allergies),
        cookingExperience: editForm.cookingExperience,
        favoriteIngredients: formatList(editForm.favoriteIngredients),
      }));

      setEditMode(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err.response?.data?.message || "Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  // Fetch profile data
  useEffect(() => {
    let isMounted = true;
    let progressInterval;

    const fetchProfile = async () => {
      try {
        setError(null);
        setLoading(true);
        setLoadingProgress(0);

        progressInterval = setInterval(() => {
          setLoadingProgress((prev) => Math.min(prev + 10, 90));
        }, 300);

        // Always fetch from API to ensure we have the latest data
        const endpoint = userId
          ? `/api/users/${userId}/profile`
          : `/api/users/me`;
        const response = await axiosInstance.get(endpoint);
        const data = response.data;

        // Ensure we have the Firebase photo URL if available
        if (!userId && currentUser && currentUser.photoURL && !data.photoURL) {
          data.photoURL = currentUser.photoURL;
        }

        if (isMounted && data) {
          setProfile(data);
          initializeEditForm(data);
          setLoadingProgress(100);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        if (isMounted) {
          setError(userDataError || err.response?.data?.message || "Failed to load profile data");
        }
      } finally {
        if (isMounted) {
          clearInterval(progressInterval);
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
      clearInterval(progressInterval);
    };
  }, [userId, currentUser, userData, userDataError, userDataLoading]);

  // Fallback if currentUser is available but no profile is set
  useEffect(() => {
    if (!userId && currentUser && !profile) {
      setProfile(currentUser);
      initializeEditForm(currentUser);
      setLoading(false);
    }
  }, [currentUser, profile, userId]);

  return {
    userId,
    profile,
    loading,
    error,
    loadingProgress,
    editMode,
    saving,
    editForm,
    profileImagePreview,
    handleInputChange,
    initializeEditForm,
    handleImageChange,
    saveProfileChanges,
    setEditMode,
  };
}
