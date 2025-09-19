'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

type LegalModalProps = {
  isOpen: boolean;
  onAccept: () => void;
};

export function LegalModal({ isOpen, onAccept }: LegalModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Terms of Service & Risk Disclosure</DialogTitle>
          <DialogDescription>
            Please read and agree to the following terms before using TeleTrader Hub.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 rounded-md border p-4">
          <h3 className="font-bold mb-2">1. General Terms</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This is a simulation. By using TeleTrader Hub (the "Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the Service. Trading financial instruments involves significant risk and is not suitable for all investors. You should not invest money that you cannot afford to lose.
          </p>
          <h3 className="font-bold mb-2">2. No Financial Advice</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The information provided by traders on this platform is for informational and educational purposes only. It is not intended as, and shall not be understood or construed as, financial advice. We are not attorneys, accountants or financial advisors, nor are we holding ourselves out to be.
          </p>
          <h3 className="font-bold mb-2">3. User Conduct</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You agree not to use the Service to:
            <ul className="list-disc pl-5 mt-2">
              <li>Post any information that is abusive, threatening, obscene, defamatory, libelous, or racially, sexually, religiously, or otherwise objectionable and offensive.</li>
              <li>Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
            </ul>
          </p>
          <h3 className="font-bold mb-2">4. Limitation of Liability</h3>
          <p className="text-sm text-muted-foreground">
            In no event shall TeleTrader Hub, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onAccept} className="bg-primary hover:bg-primary/90">I Have Read and Agree</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
