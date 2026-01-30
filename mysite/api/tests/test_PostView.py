from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import UserAccount 

class MadeProgressPostTestCase(APITestCase):
    def setUp(self):
        self.user = UserAccount.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'JWT {str(refresh.access_token)}')
        self.url = reverse('add-post') 

    def test_want_to_read_post(self):
        data = {
            "action": "want_to_read",
            "id": "yow0EAAAQBAJ"
        }

        response = self.client.post(self.url, data, format='json')
        
        #print(response.data)  
        
        self.assertEqual(response.status_code, 201)
        self.assertIn("action", response.data)
        self.assertEqual(response.data["action"], "want_to_read")
       

    
        
    def test_post_action_post(self):
        data = {
            "action": "post",
            "description": "Mi-a plăcut cum arată coperta!",
            "id": "yow0EAAAQBAJ"
        }

        response = self.client.post(self.url, data, format='json')
        
        #print(response.data)  
        
        self.assertEqual(response.status_code, 201)
        self.assertIn("action", response.data)
        self.assertEqual(response.data["action"], "post")
        self.assertIn("description", response.data)
        self.assertEqual(response.data["description"], "Mi-a plăcut cum arată coperta!")
       


    def test_post_action_review(self):
        data = {
            "action": "review",
            "rating": 3,
            "description": "SUPERR!",
            "id": "yow0EAAAQBAJ"
        }

        response = self.client.post(self.url, data, format='json')
        
        #print(response.data)  
        
        self.assertEqual(response.status_code, 201)
        self.assertIn("action", response.data)
        self.assertEqual(response.data["action"], "review")
        self.assertIn("rating", response.data)
        self.assertEqual(response.data["rating"], 3)
        self.assertIn("description", response.data)
        self.assertEqual(response.data["description"], "SUPERR!")


   

    # teste negative
    def test_post_without_auth_should_fail(self):
        self.client.credentials() 
        data = {"action": "post", "description": "test", "id": "yow0EAAAQBAJ"}
        response = self.client.post(self.url, data, format="json")
        self.assertIn(response.status_code, [401, 403])  


    def test_invalid_action_should_fail(self):
        data = {"action": "ceva_invalid", "id": "yow0EAAAQBAJ"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, 400)

    def test_missing_id_should_fail(self):
        data = {"action": "want_to_read"} 
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, 400)

    def test_review_missing_rating_should_fail(self):
        data = {"action": "review", "description": "ok", "id": "yow0EAAAQBAJ"} 
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, 400)

    def test_review_invalid_rating_should_fail(self):
        data = {"action": "review", "rating": 6, "description": "ok", "id": "yow0EAAAQBAJ"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, 400)
                



   
