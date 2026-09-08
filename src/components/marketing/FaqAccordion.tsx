import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Container } from "@/components/apple/Container";
import { SectionScheme } from "@/components/apple/SectionScheme";
import { faqs } from "@/content/faq";

export function FaqAccordion() {
  return (
    <SectionScheme id="faq" scheme="auto" className="scroll-mt-nav py-section">
      <Container width="guide">
        <h2 className="type-display-3 mb-8 text-center text-balance">
          Questions, answered.
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={faq.question}
              value={`faq-${i}`}
              className="border-b border-[var(--separator)]"
            >
              <AccordionTrigger className="type-title py-5 text-left hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="type-body pb-5 text-[var(--label-2)]">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </SectionScheme>
  );
}
