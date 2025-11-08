from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # One-to-One relationship with User model
    is_recruiter = models.BooleanField(default=False)  # Custom field to mark if the user is a recruiter

    def __str__(self):
        return f"{self.user.username}'s Profile ({'Recruiter' if self.is_recruiter else 'Candidate'})"

from django.db import models
from django.contrib.auth.models import User

class CandidateTable(models.Model):
    candidate = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        limit_choices_to={"userprofile__is_recruiter": False},  # Exclude recruiters
    )  # Link only to users who are not recruiters
    candidate_name = models.CharField(max_length=255)
    candidate_email = models.EmailField()
    candidate_cv = models.URLField()  # Store CV URL instead of file
    profile_image = models.URLField()  # Store profile image URL

    def save(self, *args, **kwargs):
        """Prevent non-admin users from modifying profile_image after it's set"""
        if self.pk:  # If the object already exists
            original = CandidateTable.objects.get(pk=self.pk)
            if original.profile_image and original.profile_image != self.profile_image:
                raise ValueError("Profile image cannot be changed. Contact admin.")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.candidate_name



class RecruiterTable(models.Model):
    recruiter = models.OneToOneField(User, on_delete=models.CASCADE, related_name="recruiter_profile")
    recruiter_organization = models.CharField(max_length=255)
    recruiter_name = models.CharField(max_length=255)

    def save(self, *args, **kwargs):
        if not self.recruiter.userprofile.is_recruiter:  # Check the UserProfile is marked as recruiter

            raise ValueError(f"User {self.user.username} is not marked as a recruiter.")
        super().save(*args, **kwargs)  # Call the original save method

    def __str__(self):
        return f"Recruiter: {self.recruiter_name} ({self.recruiter_organization})"
