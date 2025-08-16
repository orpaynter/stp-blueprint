import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, FileText, Mail } from 'lucide-react';

const Success: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session_id');
    if (session) {
      setSessionId(session);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-[#161B22] border-[#58A5FF]/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 bg-[#1FF6EB]/20 rounded-full w-fit">
            <CheckCircle className="h-12 w-12 text-[#1FF6EB]" />
          </div>
          <CardTitle className="text-2xl text-[#1FF6EB]">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-lg text-[#C9D1D9]">
            Your AI damage report is being generated right now.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center space-y-2">
              <Clock className="h-8 w-8 text-[#58A5FF]" />
              <span className="font-semibold text-[#C9D1D9]">5-10 Minutes</span>
              <span className="text-sm text-[#C9D1D9]/50">Processing Time</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <FileText className="h-8 w-8 text-[#FFF66A]" />
              <span className="font-semibold text-[#C9D1D9]">Professional Report</span>
              <span className="text-sm text-[#C9D1D9]/50">Insurance Ready</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Mail className="h-8 w-8 text-[#1FF6EB]" />
              <span className="font-semibold text-[#C9D1D9]">Email Delivery</span>
              <span className="text-sm text-[#C9D1D9]/50">Instant Notification</span>
            </div>
          </div>
          
          <div className="bg-[#58A5FF]/10 p-4 rounded-lg border border-[#58A5FF]/20">
            <h3 className="font-semibold mb-2 text-[#C9D1D9]">What happens next?</h3>
            <ul className="text-left space-y-1 text-sm text-[#C9D1D9]/70">
              <li>✅ Your photos are being analyzed by our AI</li>
              <li>✅ Professional damage report is being generated</li>
              <li>✅ Cost estimates are being calculated</li>
              <li>✅ Report will be emailed when complete</li>
            </ul>
          </div>
          
          <div className="text-sm text-[#C9D1D9]/70">
            <p>Questions? Email: support@orpaynter.ai</p>
            <p>Session ID: {sessionId}</p>
          </div>
          
          <a 
            href="/"
            className="inline-block bg-[#58A5FF] text-[#0D1117] px-6 py-2 rounded hover:bg-[#58A5FF]/80 transition-colors font-bold"
          >
            Get Another Report
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default Success;
