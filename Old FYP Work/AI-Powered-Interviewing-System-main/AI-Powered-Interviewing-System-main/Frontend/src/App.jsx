import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CandidateLogin from "@/components/auth/CandidateLogin";
import Signup from "@/components/auth/Signup";
import Logout from "@/components/auth/Logout";
import RecruiterLogin from "@/components/auth/RecruiterLogin";
import RecruiterDashboard from "@/components/dashboard/RecruiterDashboard";
import JobPostingPage from "@/components/jobposts/JobPostingPage";
import ApplicationForm from "@/components/jobapplications/ApplicationForm";
import LandingPage from "@/components/pages/LandingPage";
import ViewJobPage from "@/components/jobposts/ViewJobPage";
import AllPosts from "@/components/jobposts/AllPosts";
import ApplicantsDetailsPage from "@/components/jobapplications/ApplicantsDetailsPage";
import ApplicantProfilePage from "@/components/jobapplications/ApplicantProfilePage";
import Interview from "@/components/interview/Interview";
import ThankYou from "@/components/pages/ThankYou";
import CandidateDashboard from "@/components/dashboard/CandidateDashboard";
import CandidateAppliedJobs from "@/components/jobposts/CandidateAppliedJobs";
import FaceVerification from "@/components/interview/FaceVerification";
import PendingVerification from "./components/pages/PendingVerification";
import RecruiterSignUp from "./components/auth/RecruiterSignUp";
// import Test from "./components/Test";
// Component to conditionally render based on the current route
const AppContent = () => {
    // const location = useLocation(); // Hook to get the current route

    return (
        <div className="container">
            {/* {location.pathname === "/NewsPage" && <NewsPage />} */}

            <Routes>                
                {/* <Route path="/NewsPage" element={<NewsPage />} /> */}
                <Route path="/candidate-login" element={<CandidateLogin />} />
                <Route path="/recruiter-login" element={<RecruiterLogin />} />
                <Route path="/recruiter-signup" element={<RecruiterSignUp />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />
                <Route path="/JobPosting" element={<JobPostingPage />} />
                <Route path="/application-form" element={<ApplicationForm />} />
                <Route path="/" element={<LandingPage />} />
                <Route path="/view-job" element={<ViewJobPage/>} />
                <Route path="/publicposts" element={<AllPosts/>}></Route>
                <Route path="/applied-jobs" element={<CandidateAppliedJobs/>}/>
                <Route path="/job-applicants" element={<ApplicantsDetailsPage />} />
                <Route path="/applicant-profile" element={<ApplicantProfilePage />} />
                <Route path="chat/" element={<Interview />} />
                <Route path="/thank-you" element={<ThankYou />} />
                <Route path="/candidate-dashboard" element={<CandidateDashboard/>}/>
                <Route path="/face-verification" element={<FaceVerification />} />
                <Route path="/pending-verification" element={<PendingVerification />} />
                {/* <Route path="/test" element={<Test />} /> */}
            </Routes>
        </div>
    );
};

function App() {
    return (
        <Router>
            {/* Wrap AppContent so it can use useLocation */}
            {/* <ConditionalNavRecruiter /> */}
            {/* <ConditionalNavCandidate/> */}
            <AppContent />
        </Router>
    );
}

export default App;

