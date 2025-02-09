from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("quiz/", include("quiz.urls")),
    path("api/", include("quiz.api_urls")),
]
