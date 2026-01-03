from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        'message': 'Welcome to AI Recruitment System API',
        'version': '1.0',
        'endpoints': {
            'admin': '/admin/',
            'candidates_api': '/api/candidates/',
            'apply': '/api/candidates/apply/',
        }
    })