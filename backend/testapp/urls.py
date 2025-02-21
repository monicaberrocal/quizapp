from django.contrib import admin
from django.urls import include, path
import debug_toolbar

urlpatterns = [
    path("admin/", admin.site.urls),
    # path("quiz/", include("quiz.urls")),
    path("api/", include("quiz.api_urls")),
    path("__debug__/", include(debug_toolbar.urls)),
]
