from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from huggingface_hub import InferenceClient
from django.views.decorators.csrf import csrf_exempt
import re
import csv
import os
from datetime import datetime
from django.conf import settings
from corsheaders.defaults import default_headers
from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from huggingface_hub import InferenceClient
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from job_posting.models import JobPostingTable, ApplicationTable
from authentication.models import CandidateTable
from groq import Groq
import threading

# Initialize the Groq client
client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# Helper function to get interview details from database
def get_interview_details(job_id, candidate_id):
    """
    Fetches job and candidate details from database for the interview.
    """
    try:
        print(f"Looking for job with ID: {job_id}")
        job = get_object_or_404(JobPostingTable, id=job_id)
        print(f"Found job: {job.title}")
        
        print(f"Looking for candidate with ID: {candidate_id}")
        candidate = get_object_or_404(CandidateTable, id=candidate_id)
        print(f"Found candidate: {candidate.candidate_name if hasattr(candidate, 'candidate_name') else 'Unknown'}")
        
        # Get the application
        print(f"Looking for application with job_id={job_id}, candidate_id={candidate_id}")
        application = get_object_or_404(ApplicationTable, job=job, candidate=candidate)
        print(f"Found application for: {application.full_name}")
        
        # Convert skills list to string format for LLM
        base_skills = "Object oriented programming, functions, and Data structures"
        
        # Handle skills - check if it's a list or string
        if hasattr(job, 'skills'):
            if isinstance(job.skills, list):
                job_specific_skills = ", ".join(job.skills)
            elif isinstance(job.skills, str):
                job_specific_skills = job.skills
            else:
                job_specific_skills = str(job.skills)
        else:
            job_specific_skills = ""
            
        combined_skills = f"{base_skills}, {job_specific_skills}" if job_specific_skills else base_skills
        
        result = {
            'job': job.title,
            'skills': combined_skills,
            'experience': job.experience_level if hasattr(job, 'experience_level') else 'Not specified',
            'candidate_name': application.full_name,
            'profile_image': candidate.profile_image if hasattr(candidate, 'profile_image') else None,
            'interview_frames': application.interview_frames if hasattr(application, 'interview_frames') else []
        }
        
        print(f"Successfully built interview details: {result['job']} for {result['candidate_name']}")
        return result
        
    except Exception as e:
        print(f"ERROR in get_interview_details: {e}")
        import traceback
        traceback.print_exc()
        raise

def get_intent(response):
    """
    Sends the candidate's response to the LM for intent classification.
    """
    intent_prompt = f"""
    The following is a response from a candidate during a job interview. Just return the intent of their response in single word into one of these categories:
    --> Telling_Personal_Info
    --> Answering_to_a_technical_question_in_an_interview
    --> Quit_interview
    --> Asking_for_clarification_or_hint
    --> Others
    Candidate's response: "{response}"
    Intent: ?
    Return exact intent, not its number"""
    try:
        # Generate intent classification
        intent_response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Updated to current Groq model
            messages=[
                {
                    "role": "user",
                    "content": intent_prompt
                },
            ],
            temperature=1,
            top_p=1,
            stop=None,
        )
        # Extract intent from the LM's response
        intent_message = intent_response.choices[0].message.content.strip()
        return intent_message
    except Exception as e:
        print(f"Intent classification error: {e}")
        return "Others"

def extract_questions(text):
    # Use regex to find sentences ending with a question mark
    questions = re.findall(r'[^.!?]*\?', text)
    
    # Strip any leading/trailing whitespace from each question
    questions = [q.strip() for q in questions]
    
    # Join the questions with a space
    return ' '.join(questions)

def extract_score_and_comment(score_response):
    """
    Extracts the score and comment from the response string.
    """
    match = re.search(r'(\d+)/10\s*Comment:\s*(.*)', score_response)
    if match:
        score = int(match.group(1))  # Extracts the numerical score
        comment = match.group(2)    # Extracts the comment text
        return score, comment
    else:
        return None, None

def score_answer(question, answer):
    """
    Scores the candidate's answer to a technical question.
    """
    question = extract_questions(question)
    print("The question was:", question)
    print("\n" * 4)
    print("The answer is: ", answer)
    if not question:
        return "Not Applicable"
    scoring_prompt = f"""
    You are an evaluator for a technical job interview answers. Score the candidate's answer to the question on a scale from 0 to 10.
    Provide the score only if the answer is relevant and addresses the question.
    Return "Not Applicable" if
    "1. Candidate is Greeting
    2. Asking for clarification in the asked question
    3. If the asked question is not technical."

    Below is the marking scheme:
    "4 marks for relevance, 3 for Completness, 3 for Correctness."

    After considering all these factors in the marking scheme, just return a final score out of 10.
    Question: "{question}"

    Answer: "{answer}"

    Below is Your response format:
    "?/10
    Comment: (5 to 10 words maximum)"
    Strictly follow all the instructions.
    """
    try:
        # Generate score
        score_response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Updated to current Groq model
            messages=[
                {
                    "role": "user",
                    "content": scoring_prompt
                },
            ],
            temperature=1,
            top_p=1,
            stop=None,
        )
        # Extract score
        score = score_response.choices[0].message.content.strip()
        return score
    except Exception as e:
        print(f"Scoring error: {e}")
        return "Not Applicable"

# Global variable to track interview state
interview_state = {
    "messages": [],
    "question_count": 0,
    "current_question": None,
    "interview_log": [],
    "current_job_id": None,
    "current_candidate_id": None,
    "total_score": 0,
    "total_questions": 0,
    "is_intro_phase": False,
    "is_completed": False
}

def save_interview_to_csv(interview_log, candidate_name, job):
    """
    Saves the interview session to a new CSV file.

    Args:
        interview_log (list): List of dictionaries containing question, answer, score, and comment.
        candidate_name (str): Name of the candidate.
        job (str): Job position.
    """
    # Ensure the 'interviews' directory exists
    directory = "interviews"
    os.makedirs(directory, exist_ok=True)

    # Create a unique filename based on the timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(directory, f"{candidate_name}_{job}_{timestamp}.csv")

    # Define CSV columns
    fieldnames = ["question", "answer", "score", "comment"]

    # Write data to the CSV file
    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(interview_log)

def create_initial_system_message(interview_details):
    return {
        "role": "user", 
        "content": f"You are a technical job interviewer for a job of {interview_details['job']}, to test the following skills: "
                  f"{interview_details['skills']}. "
                  f"Candidate name is {interview_details['candidate_name']}. "
                  f"Experience/difficulty Requirement is {interview_details['experience']}. "
                  "Ask about experience. "
                  f"Ask questions only for these skills: {interview_details['skills']}. "
                  "Ask exactly 2 questions for each skill one by one. (No compromise) "
                  "Ask one question at a time. (Do not ask multiple questions at once, even if the candidate requests it) "
                  "Do not get stuck on same question, move on to the next question. "
                  "After asking all the questions, thank the candidate and end the interview. "
                  "Strictly stay on the topic. (same job and skills) "
                  "Be concise. "
                  "Strictly follow real life interview process. "
                  "Remember, it is not a mock interview. It is a real interview. So, be strict to it. "
                  "IMPORTANT: The interview will automatically end after 10 questions, so pace yourself accordingly."
    }

@api_view(['POST'])
@csrf_exempt
@permission_classes([AllowAny])
def chatbot_response(request):
    """
    Modified chatbot response view with per-question scoring
    """
    print("=" * 80)
    print("CHATBOT RESPONSE CALLED")
    print(f"Request data: {request.data}")
    print("=" * 80)
    
    try:
        # Check if this is the start of a new interview
        if 'reset' in request.data and request.data['reset']:
            print("RESET REQUEST DETECTED")
            job_id = request.data.get('job_id')
            candidate_id = request.data.get('candidate_id')
            
            print(f"Job ID: {job_id}, Candidate ID: {candidate_id}")
            
            if not job_id or not candidate_id:
                print("ERROR: Missing job_id or candidate_id")
                return Response({'error': 'job_id and candidate_id are required'}, status=400)
            
            print("Fetching interview details...")
            try:
                interview_details = get_interview_details(job_id, candidate_id)
                print(f"Interview details retrieved: {interview_details['job']}, {interview_details['candidate_name']}")
            except Exception as detail_error:
                print(f"ERROR in get_interview_details: {detail_error}")
                import traceback
                traceback.print_exc()
                return Response({'error': f'Failed to get interview details: {str(detail_error)}'}, status=500)
            
            # Reset interview state
            print("Resetting interview state...")
            interview_state["messages"] = [create_initial_system_message(interview_details)]
            interview_state["question_count"] = 0
            interview_state["current_question"] = None
            interview_state["interview_log"] = []
            interview_state["total_score"] = 0
            interview_state["total_questions"] = 0
            interview_state["current_job_id"] = job_id
            interview_state["current_candidate_id"] = candidate_id
            interview_state["is_intro_phase"] = True
            interview_state["is_completed"] = False
            
            initial_message = f"Hello! Nice to meet you, dear {interview_details['candidate_name']}. Can you please introduce yourself?"
            
            # Set this as the current question
            interview_state["current_question"] = initial_message
            
            print(f"Sending initial message: {initial_message}")
            
            return Response({
                'response': initial_message, 
                'reset': True,
                'candidateName': interview_details['candidate_name']
            })
    except Exception as e:
        print(f"Error in chatbot_response: {e}")
        return Response({'error': str(e)}, status=500)
    
    # Get user input
    user_input = request.data.get('message', '')
    print(f"USER INPUT: '{user_input}'")
    
    if not user_input:
        print("ERROR: No user input provided!")
        return Response({'error': 'No message provided'}, status=400)

    # Perform intent classification
    intent = get_intent(user_input)
    print(f"Detected Intent: {intent}")
    print(f"Current interview state: question_count={interview_state['question_count']}, "
          f"is_intro_phase={interview_state.get('is_intro_phase', False)}, "
          f"total_questions={interview_state['total_questions']}")
    print(f"Messages in conversation: {len(interview_state['messages'])}")

    # Check if the intent is to quit the interview or max questions reached
    # Interview ends at 10 questions (after intro which is not counted)
    if intent == "Quit_interview" or interview_state["question_count"] >= 10:
        print("Interview ending - starting background tasks")
        print(f"Reason: Intent={intent}, Question count={interview_state['question_count']}")
        interview_state["is_completed"] = True
        
        # Define the face verification function
        def run_face_verification():
            # Get the full response from verify_interview_frames
            full_verification_response = verify_interview_frames(
                interview_state["current_candidate_id"],
                interview_state["current_job_id"]
            )
            print("Face Verification Full Response:", full_verification_response)
            
            # Extract the verification_results list
            verification_results_list = full_verification_response.get("verification_results", [])
            
            # Extract the summary dictionary
            verification_summary = full_verification_response.get("summary", {})
            
            print("Verification Results List:", verification_results_list)
            print("Verification Summary:", verification_summary)
            
            # Confidence Prediction Function
            def run_confidence_prediction():
                print("Running Confidence Prediction Model...")
                
                # Pass the same frames used in face verification
                confidence_results = confidence_prediction(
                    interview_state["current_candidate_id"],
                    interview_state["current_job_id"]
                )
                confidence_results_scores = confidence_results.get("confidence_scores")
                confidence_results_avg = confidence_results.get("average_confidence")
                confidence_results_score = confidence_results.get("final_score")
                print("Confidence Predicted Score Per Frame: ", confidence_results_scores)
                print("Confidence Prediction Average Score: ", confidence_results_avg)
                print("Confidence Prediction Score with 20% Weighted: ", confidence_results_score)

                try:
                    application = ApplicationTable.objects.get(
                        job_id=interview_state["current_job_id"],
                        candidate_id=interview_state["current_candidate_id"]
                    )

                    # Store confidence prediction results in DB
                    application.confidence_score = confidence_results_score
                    application.save()
                    print("Successfully saved confidence prediction results.")

                except ApplicationTable.DoesNotExist:
                    print("Application not found for confidence prediction.")
                except Exception as e:
                    print(f"Error updating confidence prediction: {e}")

            # Run confidence prediction in a separate thread
            confidence_thread = threading.Thread(target=run_confidence_prediction, daemon=True)
            confidence_thread.start()
            
            # Move this calculation inside the function
            if interview_state["total_questions"] > 0:
                total_score = round(interview_state['total_score'], 1)
                total_possible = interview_state["total_questions"] * 10
                marks_string = f"{total_score}/{total_possible}"
                print("=" * 80)
                print(f"FINAL INTERVIEW RESULTS:")
                print(f"Total Score: {total_score}")
                print(f"Total Possible: {total_possible}")
                print(f"Marks String: {marks_string}")
                print(f"Total Questions Scored: {interview_state['total_questions']}")
                print("=" * 80)
                
                # Update database inside the function
                if interview_state["current_job_id"] and interview_state["current_candidate_id"]:
                    try:
                        print(f"Looking for application: job_id={interview_state['current_job_id']}, candidate_id={interview_state['current_candidate_id']}")
                        
                        application = ApplicationTable.objects.get(
                            job_id=interview_state["current_job_id"],
                            candidate_id=interview_state["current_candidate_id"]
                        )
                        
                        print(f"Found application ID: {application.id}")
                        
                        # Update interview results
                        application.interview_status = True
                        application.marks = marks_string
                        
                        print(f"Updated marks to: {application.marks}")
                        print("Setting face verification results...")
                        application.face_verification_result = verification_results_list
                        print(f"Verification results set: {len(verification_results_list)} results")
                        
                        # Check verification rate and set flag_status accordingly
                        verification_rate = verification_summary.get("verification_rate", 0)
                        print(f"Verification rate: {verification_rate}%")
                        
                        if verification_rate > 80:
                            application.flag_status = False  # Good verification rate
                            print("Flag status: False (Good verification)")
                        else:
                            application.flag_status = True   # Poor verification rate
                            print("Flag status: True (Poor verification - possible cheating)")

                        # Save all changes
                        application.save()
                        print("=" * 80)
                        print("✅ APPLICATION SUCCESSFULLY UPDATED IN DATABASE")
                        print(f"Interview Status: {application.interview_status}")
                        print(f"Marks: {application.marks}")
                        print(f"Flag Status: {application.flag_status}")
                        print(f"Verification Rate: {verification_rate}%")
                        print("=" * 80)

                    except ApplicationTable.DoesNotExist:
                        print("=" * 80)
                        print("❌ ERROR: Application not found in database")
                        print(f"Searched for: job_id={interview_state['current_job_id']}, candidate_id={interview_state['current_candidate_id']}")
                        print("=" * 80)
                    except Exception as e:
                        print("=" * 80)
                        print(f"❌ ERROR updating application: {e}")
                        import traceback
                        traceback.print_exc()
                        print("=" * 80)
            else:
                print("=" * 80)
                print("⚠️ WARNING: No questions were scored, not updating database")
                print("=" * 80)
        
        # Start the verification in a background thread
        thread = threading.Thread(target=run_face_verification, daemon=True)
        thread.start()
        
        response_data = {
            'response': "Thank you for your time. The interview is now completed. Your responses are being evaluated. Good luck with your application!",
            'question_count': interview_state["question_count"],
            'intent': intent,
            'interview_ended': True  # Add this flag for frontend
        }
        return Response(response_data)

    # Append the user's message to the conversation history
    interview_state["messages"].append({"role": "user", "content": user_input})

    # Score the answer if there's a current question AND we're past intro
    if interview_state["current_question"] and not interview_state.get("is_intro_phase", False):
        score_result = score_answer(interview_state["current_question"], user_input)
        score, comment = extract_score_and_comment(score_result)
        
        print(f"DEBUG: Raw score_result = '{score_result}'")
        print(f"DEBUG: Extracted score = {score}, comment = '{comment}'")
        
        # Update total score only if it's a numeric score
        if score is not None:
            try:
                numeric_score = float(score)
                interview_state["total_score"] += numeric_score
                interview_state["total_questions"] += 1
                print(f"✅ Score added: {score}/10 - {comment}")
                print(f"📊 Running total: {interview_state['total_score']}/{interview_state['total_questions']*10}")
            except (ValueError, TypeError) as e:
                print(f"⚠️ Score parsing failed: {e}")
                print(f"Score was: {score_result}")
        else:
            print(f"⚠️ Score was None, result was: {score_result}")
        
        # Log the interview details
        interview_log_entry = {
            "question": interview_state["current_question"],
            "answer": user_input,
            "score": score if score else "Not Applicable",
            "comment": comment if comment else "",
            "running_total": f"{interview_state['total_score']}/{interview_state['total_questions']*10}" if interview_state['total_questions'] > 0 else "0/0"
        }
        interview_state["interview_log"].append(interview_log_entry)
    elif interview_state.get("is_intro_phase", False):
        # If it's intro phase, just log without scoring
        print("Introduction phase - not scoring this response")
        interview_state["is_intro_phase"] = False  # End intro phase after first response

    # Generate the assistant's response
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",  # Updated to current Groq model
        messages=interview_state["messages"],
        temperature=1,
        top_p=1,
        stop=None,
    )

    # Extract the assistant's message
    assistant_message = completion.choices[0].message.content

    # Append the assistant message to messages
    interview_state["messages"].append({"role": "assistant", "content": assistant_message})

    # Set current_question to LLM's response
    interview_state["current_question"] = assistant_message

    # Increment question count only for actual questions (not intro)
    if not interview_state.get("is_intro_phase", False):
        interview_state["question_count"] += 1

    print(f'Question #{interview_state["question_count"]}: {assistant_message}')
    
    # CHECK AGAIN AFTER INCREMENT - if we've now reached 10 questions, end the interview
    if interview_state["question_count"] >= 10:
        print("=" * 80)
        print(f"INTERVIEW LIMIT REACHED: {interview_state['question_count']} questions asked")
        print("Triggering interview completion...")
        print("=" * 80)
        
        interview_state["is_completed"] = True
        
        # Define face verification function inline
        def run_face_verification():
            full_verification_response = verify_interview_frames(
                interview_state["current_candidate_id"],
                interview_state["current_job_id"]
            )
            print("Face Verification Full Response:", full_verification_response)
            
            verification_results_list = full_verification_response.get("verification_results", [])
            verification_summary = full_verification_response.get("summary", {})
            
            print("Verification Results List:", verification_results_list)
            print("Verification Summary:", verification_summary)
            
            def run_confidence_prediction():
                print("Running Confidence Prediction Model...")
                
                confidence_results = confidence_prediction(
                    interview_state["current_candidate_id"],
                    interview_state["current_job_id"]
                )
                confidence_results_scores = confidence_results.get("confidence_scores")
                confidence_results_avg = confidence_results.get("average_confidence")
                confidence_results_score = confidence_results.get("final_score")
                print("Confidence Predicted Score Per Frame: ", confidence_results_scores)
                print("Confidence Prediction Average Score: ", confidence_results_avg)
                print("Confidence Prediction Score with 20% Weighted: ", confidence_results_score)

                try:
                    application = ApplicationTable.objects.get(
                        job_id=interview_state["current_job_id"],
                        candidate_id=interview_state["current_candidate_id"]
                    )
                    application.confidence_score = confidence_results_score
                    application.save()
                    print("Successfully saved confidence prediction results.")
                except ApplicationTable.DoesNotExist:
                    print("Application not found for confidence prediction.")
                except Exception as e:
                    print(f"Error updating confidence prediction: {e}")

            confidence_thread = threading.Thread(target=run_confidence_prediction, daemon=True)
            confidence_thread.start()
            
            if interview_state["total_questions"] > 0:
                total_score = round(interview_state['total_score'], 1)
                total_possible = interview_state["total_questions"] * 10
                marks_string = f"{total_score}/{total_possible}"
                print("=" * 80)
                print(f"FINAL INTERVIEW RESULTS:")
                print(f"Total Score: {total_score}")
                print(f"Total Possible: {total_possible}")
                print(f"Marks String: {marks_string}")
                print(f"Total Questions Scored: {interview_state['total_questions']}")
                print("=" * 80)
                
                if interview_state["current_job_id"] and interview_state["current_candidate_id"]:
                    try:
                        print(f"Looking for application: job_id={interview_state['current_job_id']}, candidate_id={interview_state['current_candidate_id']}")
                        
                        application = ApplicationTable.objects.get(
                            job_id=interview_state["current_job_id"],
                            candidate_id=interview_state["current_candidate_id"]
                        )
                        
                        print(f"Found application ID: {application.id}")
                        
                        application.interview_status = True
                        application.marks = marks_string
                        
                        print(f"Updated marks to: {application.marks}")
                        print("Setting face verification results...")
                        application.face_verification_result = verification_results_list
                        print(f"Verification results set: {len(verification_results_list)} results")
                        
                        verification_rate = verification_summary.get("verification_rate", 0)
                        print(f"Verification rate: {verification_rate}%")
                        
                        if verification_rate > 80:
                            application.flag_status = False
                            print("Flag status: False (Good verification)")
                        else:
                            application.flag_status = True
                            print("Flag status: True (Poor verification - possible cheating)")

                        application.save()
                        print("=" * 80)
                        print("✅ APPLICATION SUCCESSFULLY UPDATED IN DATABASE")
                        print(f"Interview Status: {application.interview_status}")
                        print(f"Marks: {application.marks}")
                        print(f"Flag Status: {application.flag_status}")
                        print(f"Verification Rate: {verification_rate}%")
                        print("=" * 80)

                    except ApplicationTable.DoesNotExist:
                        print("=" * 80)
                        print("❌ ERROR: Application not found in database")
                        print(f"Searched for: job_id={interview_state['current_job_id']}, candidate_id={interview_state['current_candidate_id']}")
                        print("=" * 80)
                    except Exception as e:
                        print("=" * 80)
                        print(f"❌ ERROR updating application: {e}")
                        import traceback
                        traceback.print_exc()
                        print("=" * 80)
            else:
                print("=" * 80)
                print("⚠️ WARNING: No questions were scored, not updating database")
                print("=" * 80)
        
        thread = threading.Thread(target=run_face_verification, daemon=True)
        thread.start()
        
        response_data = {
            'response': "Thank you for your time. The interview is now completed. Your responses are being evaluated. Good luck with your application!",
            'question_count': interview_state["question_count"],
            'intent': 'Quit_interview',
            'interview_ended': True
        }
        
        return Response(response_data)
    
    # Prepare response
    response_data = {
        'response': assistant_message,
        'question_count': interview_state["question_count"],
        'intent': intent
    }
    
    return Response(response_data)


@api_view(['GET'])
@permission_classes([AllowAny])
def chatbot_page(request):
    return render(request, 'chatbot.html')


from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist
import logging

logger = logging.getLogger(__name__)
from django.middleware.csrf import get_token

@ensure_csrf_cookie
def get_csrf_token(request):
    """
    This view sets the CSRF cookie and returns a 200 response
    """
    return JsonResponse({'csrfToken': get_token(request)})

def sanitize_filename(filename):
    # Remove invalid characters and replace with underscores
    # Windows doesn't allow: < > : " / \ | ? *
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    return sanitized

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ensure_csrf_cookie
def save_frame(request):
    try:
        if not request.FILES.get('frame'):
            return Response({
                'success': False,
                'error': 'No frame provided'
            }, status=400)

        frame = request.FILES['frame']
        job_id = request.POST.get('job_id')
        candidate_id = request.POST.get('candidate_id')
        timestamp = request.POST.get('timestamp')

        # Create a safe filename using timestamp
        safe_timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        base_filename = f'frame_{safe_timestamp}.jpg'
        
        # Create directory path
        directory = f'interview_frames/job_{job_id}/candidate_{candidate_id}'
        
        # Combine and sanitize the full filename
        filename = sanitize_filename(f'{directory}/{base_filename}')

        # Ensure directory exists
        os.makedirs(os.path.join(default_storage.location, directory), exist_ok=True)

        try:
            # Save file and get URL
            path = default_storage.save(filename, ContentFile(frame.read()))
            frame_url = default_storage.url(path)
            
            # Update ApplicationTable
            application = ApplicationTable.objects.get(
                job_id=job_id,
                candidate_id=candidate_id
            )
            
            # Initialize or update interview_frames
            current_frames = application.interview_frames
            if not isinstance(current_frames, list):
                current_frames = []
            
            frame_data = {
                'url': frame_url,
                'timestamp': timestamp,
                'filename': filename
            }
            
            current_frames.append(frame_data)
            application.interview_frames = current_frames
            application.save()
            
            return Response({
                'success': True,
                'url': frame_url,
                'frame_data': frame_data
            })
            
        except Exception as e:
            # Clean up file if it was saved but database update failed
            if 'path' in locals():
                default_storage.delete(path)
            raise e

    except Exception as e:
        logger.error(f"Error in save_frame: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_candidate(request):
    """
    Endpoint to get the current logged-in candidate's details
    """
    try:
        candidate = get_object_or_404(CandidateTable, candidate=request.user)
        return Response({
            'id': candidate.id,
            'name': candidate.candidate_name,
            'email': candidate.candidate_email,
            'profile': candidate.profile_image
        })
    except Exception as e:
        return Response({'error': str(e)}, status=400)


from rest_framework.response import Response
import requests

def verify_interview_frames(candidate_id, job_id):
    """
    Call face verification endpoint and get results for all frames
    """
    try:
        # Get interview details including frames and profile image
        interview_details = get_interview_details(job_id, candidate_id)
        
        # Prepare data for face verification
        verification_data = {
            "profile_image": interview_details.get('profile_image'),
            "frames": [
                {"url": frame["url"]} for frame in interview_details.get('interview_frames', [])
            ]
        }

        # Using properly formatted URL
        verification_url = f"{settings.BASE_URL}/api/confidence_prediction/verify-face/cheat/"
        
        # Call face verification endpoint
        response = requests.post(
            verification_url,
            json=verification_data,
        )
        
        if response.status_code == 200:
            return response.json()
        return None

    except Exception as e:
        logger.error(f"Error in frame verification: {e}")
        return None


def confidence_prediction(candidate_id, job_id):
    """
    Call confidence prediction endpoint for all frames
    """
    try:
        # Get interview details
        interview_details = get_interview_details(job_id, candidate_id)
        if not interview_details:
            print("No interview details found")
            return None
            
        # Check if frames exist
        frames = interview_details.get('interview_frames', [])
        if not frames:
            print("No frames found in interview details")
            return None

        confidence_url = f"{settings.BASE_URL}/api/confidence_prediction/analyze-confidence/"
        
        # Construct full URLs for frames
        domain = settings.BASE_URL.rstrip('/')  # Remove trailing slash if present
        frame_data = []
        for frame in frames:
            # Get relative URL and ensure it starts with a single forward slash
            relative_url = frame["url"].lstrip('/')
            full_url = f"{domain}/{relative_url}"
            frame_data.append({"url": full_url})
        
        # Prepare data
        confidence_data = {
            "frames": frame_data
        }
        
        print(f"Sending request with frame URLs:")
        for frame in frame_data:
            print(f"Frame URL: {frame['url']}")
        
        # Call confidence prediction endpoint
        response = requests.post(
            confidence_url,
            json=confidence_data,
        )
        
        print(f"Confidence prediction response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Confidence prediction response: {result}")
            return result
        else:
            print(f"Confidence prediction failed with status {response.status_code}")
            print(f"Response content: {response.text}")
            return None
        
    except Exception as e:
        print(f"Error in confidence prediction: {str(e)}")
        return None