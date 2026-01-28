"""
rulare: python manage.py test accounts.test_authentication     
"""
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import UserAccount, Profile
from django.urls import reverse
from django.db.models.signals import post_save
from unittest.mock import Mock, patch
from datetime import timedelta


class BaseAuthTestCase(APITestCase):
    """Clasa de baza pentru toate testele de autentificare"""
    
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Dezactiveaza signal-ul care creeaza Shelf-uri
        from accounts.signals import create_default_shelves
        post_save.disconnect(create_default_shelves, sender=UserAccount)
    
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        # Reactiveaza signal-ul
        from accounts.signals import create_default_shelves
        post_save.connect(create_default_shelves, sender=UserAccount)
    
    def setUp(self):
        """Configurare initiala pentru toate testele"""
        self.client = APIClient()
        
        # Creeaza utilizatori de test
        self.user1 = UserAccount.objects.create_user(
            email='user1@test.com',
            username='user1',
            first_name='Test',
            last_name='User1',
            password='testpass123'
        )
        
        self.user2 = UserAccount.objects.create_user(
            email='user2@test.com',
            username='user2',
            first_name='Test',
            last_name='User2',
            password='testpass123'
        )
        
        # Obtine profilurile
        self.profile1 = Profile.objects.get(user=self.user1)
        self.profile2 = Profile.objects.get(user=self.user2)
        
    def authenticate_user(self, user):
        """Helper pentru autentificarea unui utilizator"""
        refresh = RefreshToken.for_user(user)
        # Foloseste JWT in loc de Bearer conform settings.py
        self.client.credentials(HTTP_AUTHORIZATION=f'JWT {refresh.access_token}')
        return refresh.access_token


class ActivateAccountTests(BaseAuthTestCase):
    """Teste pentru activarea contului"""
    
    @patch('accounts.views.requests.post')
    @patch('accounts.views.getIP')
    def test_activate_success(self, mock_get_ip, mock_post):
        """Test activare cont cu succes"""
        mock_get_ip.return_value = 'localhost'
        mock_post.return_value = Mock(status_code=204)
        
        url = reverse('activate-account', kwargs={'uid': 'test-uid', 'token': 'test-token'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('success', response.data)


class ProfileTests(BaseAuthTestCase):
    """Teste pentru operatiuni pe profil"""
    
    def test_read_own_profile(self):
        """Test citire profil propriu"""
        self.authenticate_user(self.user1)
        
        url = reverse('profile-read')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['profile']['username'], 'user1')
    
    def test_read_profile_unauthenticated(self):
        """Test citire profil fara autentificare"""
        url = reverse('profile-read')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_profile(self):
        """Test actualizare profil"""
        self.authenticate_user(self.user1)
        
        url = reverse('profile-update')
        data = {'bio': 'Updated bio', 'first_name': 'UpdatedName'}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile1.refresh_from_db()
        self.assertEqual(self.profile1.bio, 'Updated bio')


class FollowTests(BaseAuthTestCase):
    """Teste pentru functionalitatea de follow/unfollow"""
    
    def test_follow_user(self):
        """Test follow user cu succes"""
        self.authenticate_user(self.user1)
        
        url = reverse('add-follower', kwargs={'pk': self.profile2.id})
        response = self.client.patch(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.profile1, self.profile2.followers.all())
    
    def test_unfollow_user(self):
        """Test unfollow user cu succes"""
        self.authenticate_user(self.user1)
        
        # Adauga follow initial
        self.profile2.followers.add(self.profile1)
        
        url = reverse('remove-follower', kwargs={'pk': self.profile2.id})
        response = self.client.patch(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(self.profile1, self.profile2.followers.all())
    
    def test_is_following(self):
        """Test verificare daca urmaresti un utilizator"""
        self.authenticate_user(self.user1)
        self.profile2.followers.add(self.profile1)
        
        url = reverse('is-following', kwargs={'pk': self.profile2.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_following'])


class FollowListTests(BaseAuthTestCase):
    """Teste pentru liste de followeri/following"""
    
    def test_get_followers_list(self):
        """Test obtinere lista followeri"""
        self.authenticate_user(self.user1)
        self.profile1.followers.add(self.profile2)
        
        url = reverse('followers-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['followers']), 1)
    
    def test_get_following_list(self):
        """Test obtinere lista following"""
        self.authenticate_user(self.user1)
        self.profile2.followers.add(self.profile1)
        
        url = reverse('following-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['following']), 1)


class ProfileSearchTests(BaseAuthTestCase):
    """Teste pentru cautare utilizatori"""
    
    def test_search_by_username(self):
        """Test cautare dupa username"""
        self.authenticate_user(self.user1)
        
        url = reverse('search-users')
        response = self.client.get(url, {'username': 'user2'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['username'], 'user2')
    
    def test_search_unauthenticated(self):
        """Test cautare fara autentificare"""
        url = reverse('search-users')
        response = self.client.get(url, {'q': 'user'})
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SecurityTests(BaseAuthTestCase):
    """Teste pentru securitate"""
    
    def test_invalid_token_rejected(self):
        """Test ca token-urile invalide sunt respinse"""
        self.client.credentials(HTTP_AUTHORIZATION='JWT invalid_token')
        
        url = reverse('profile-read')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class GoogleOAuthTests(BaseAuthTestCase):
    """Teste pentru autentificare Google OAuth2"""
    
    @patch('accounts.views.requests.get')
    def test_google_login_success(self, mock_get):
        """Test login Google cu succes"""
        # Mock raspunsul de la Google tokeninfo
        mock_get.return_value = Mock(
            status_code=200,
            json=lambda: {
                'email': 'newuser@gmail.com',
                'given_name': 'New',
                'family_name': 'User',
                'aud': 'test_client_id',
                'azp': 'test_client_id'
            }
        )
        
        with patch.dict('os.environ', {'GOOGLE_CLIENT_ID': 'test_client_id'}):
            url = reverse('google_exchange')
            data = {'id_token': 'valid_id_token'}
            response = self.client.post(url, data, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('access', response.data)
            self.assertTrue(UserAccount.objects.filter(email='newuser@gmail.com').exists())
    
    @patch('accounts.views.requests.get')
    def test_google_login_invalid_audience(self, mock_get):
        """Test login Google cu audience invalid"""
        # Mock raspuns cu audience gresit
        mock_get.return_value = Mock(
            status_code=200,
            json=lambda: {
                'email': 'test@gmail.com',
                'aud': 'wrong_client_id'  # Audience diferit
            }
        )
        
        with patch.dict('os.environ', {'GOOGLE_CLIENT_ID': 'correct_client_id'}):
            url = reverse('google_exchange')
            data = {'id_token': 'invalid_token'}
            response = self.client.post(url, data, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('error', response.data)
