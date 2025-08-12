// src/components/layout/FAQSection.tsx

'use client';

import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Plus, Minus } from 'lucide-react';

const faqData = [
    {
        question: 'Are there any prerequisites for the courses?',
        answer: 'Most of our beginner courses have no prerequisites! For advanced courses, the required knowledge is listed on the course description page. We aim to make learning accessible to everyone.',
    },
    {
        question: 'Can I get a refund if I\'m not satisfied?',
        answer: 'Absolutely. We offer a 30-day money-back guarantee on all our courses. If you are not satisfied for any reason, you can request a full refund, no questions asked.',
    },
    {
        question: 'Do I get a certificate after completing a course?',
        answer: 'Yes! Upon successful completion of any paid course, you will receive a verifiable certificate that you can add to your resume or LinkedIn profile to showcase your new skills.',
    },
    {
        question: 'How long do I have access to the courses?',
        answer: 'Once you enroll in a course, you have lifetime access to the material, including all future updates. You can learn at your own pace and revisit the content whenever you like.',
    },
];

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <div className="border-b border-gray-200 py-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between text-left"
            >
                <span className="text-lg font-medium text-gray-900">{question}</span>
                <span className="ml-6 flex-shrink-0">
                    {isOpen ? <Minus className="h-6 w-6 text-blue-600" /> : <Plus className="h-6 w-6 text-gray-400" />}
                </span>
            </button>
            {isOpen && (
                <div className="mt-4 pr-12">
                    <p className="text-base text-gray-600">{answer}</p>
                </div>
            )}
        </div>
    );
};

export function FAQSection() {
    return (
        <section className="bg-gray-50 py-24 sm:py-32">
            <Container>
                <div className="mx-auto max-w-4xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
                        <p className="text-gray-600 mt-4">Have questions? We have answers. If you can&apos;t find what you&apos;re looking for, feel free to contact us.</p>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {faqData.map(faq => (
                            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>
                </div>
            </Container>
        </section>
    );
}