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
          <DialogTitle className="font-headline text-2xl">Условия предоставления услуг и раскрытие рисков</DialogTitle>
          <DialogDescription>
            Пожалуйста, прочитайте и согласитесь с условиями, прежде чем использовать PulseScalp.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 rounded-md border p-4">
          <h3 className="font-bold mb-2">1. Общие условия</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Это симуляция. Используя PulseScalp («Сервис»), вы соглашаетесь с настоящими Условиями предоставления услуг. Если вы не согласны с какой-либо частью условий, вы не имеете права доступа к Сервису. Торговля финансовыми инструментами сопряжена со значительным риском и подходит не всем инвесторам. Вы не должны вкладывать деньги, которые не можете позволить себе потерять.
          </p>
          <h3 className="font-bold mb-2">2. Отсутствие финансовых консультаций</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Информация, предоставляемая трейдерами на этой платформе, предназначена только для информационных и образовательных целей. Она не является и не должна рассматриваться как финансовая консультация. Мы не являемся юристами, бухгалтерами или финансовыми консультантами и не представляем себя таковыми.
          </p>
          <h3 className="font-bold mb-2">3. Поведение пользователей</h3>
          <div className="text-sm text-muted-foreground mb-4">
            <p>Вы соглашаетесь не использовать Сервис для:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>Публикации любой информации, которая является оскорбительной, угрожающей, непристойной, клеветнической, дискредитирующей, расово, сексуально, религиозно или иным образом нежелательной и оскорбительной.</li>
              <li>Выдачи себя за любое физическое или юридическое лицо, или ложного заявления или иного искажения вашей связи с физическим или юридическим лицом.</li>
            </ul>
          </div>
          <h3 className="font-bold mb-2">4. Ограничение ответственности</h3>
          <p className="text-sm text-muted-foreground">
            Ни при каких обстоятельствах PulseScalp, ни его директора, сотрудники, партнеры, агенты, поставщики или аффилированные лица не несут ответственности за любые косвенные, случайные, специальные, побочные или штрафные убытки, включая, помимо прочего, потерю прибыли, данных, использования, деловой репутации или других нематериальных потерь, возникших в результате вашего доступа или использования или невозможности доступа или использования Сервиса.
          </p>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onAccept} className="bg-primary hover:bg-primary/90">Я прочитал и согласен</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
