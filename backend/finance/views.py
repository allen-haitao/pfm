
from rest_framework.views import APIView
from .serializer import UsersSerializer
from django.http.response import JsonResponse


class Userview(APIView):

    def post(self, request):
        data = request.data
        serializer = UsersSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return JsonResponse("user register successful", safe=False)
        return JsonResponse("user register false", safe=False)
