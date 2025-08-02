'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Quiz } from '@/types';

export const quizSchema = z.object({
    question: z.string().min(5, 'Question must be at least 5 characters'),
    answers: z.array(z.object({
        id: z.string().optional(),
        answer: z.string().min(1, 'Answer cannot be empty'),
        isCorrect: z.boolean(),
    })).length(4, "You must provide exactly 4 answers.").refine(
        (answers) => answers.filter(a => a.isCorrect).length === 1,
        { message: "Exactly one answer must be marked as correct." }
    ),
});
export type QuizFormData = z.infer<typeof quizSchema>;

interface QuizFormProps {
    onSubmit: (data: QuizFormData) => void;
    initialData?: Quiz;
    isPending: boolean;
    onCancel: () => void;
}

export function QuizForm({ onSubmit, initialData, isPending, onCancel }: QuizFormProps) {
    // --- THIS IS THE FIX ---
    // Destructure getValues and setValue from the main useForm hook
    const { register, handleSubmit, control, getValues, setValue, formState: { errors } } = useForm<QuizFormData>({
        resolver: zodResolver(quizSchema),
        defaultValues: initialData || {
            question: '',
            answers: [
                { answer: '', isCorrect: true },
                { answer: '', isCorrect: false },
                { answer: '', isCorrect: false },
                { answer: '', isCorrect: false },
            ]
        }
    });

    const { fields } = useFieldArray({ control, name: "answers" });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-gray-50 p-4 rounded-lg">
            <Input label="Question" registration={register('question')} error={errors.question?.message} />
            
            <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Answers (select the correct one)</label>
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-3">
                        <Controller
                            control={control}
                            name={`answers.${index}.isCorrect`}
                            render={({ field: { value, ...restField } }) => (
                                <input
                                    type="radio"
                                    {...restField}
                                    onChange={() => {
                                        // --- THIS IS THE FIX ---
                                        // Call getValues() and setValue() directly
                                        const currentAnswers = getValues('answers');
                                        const newAnswers = currentAnswers.map((ans, i) => ({ ...ans, isCorrect: i === index }));
                                        setValue('answers', newAnswers, { shouldValidate: true });
                                    }}
                                    checked={value}
                                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                    name="correctAnswerRadio"
                                />
                            )}
                        />
                        <div className="flex-grow">
                            <input
                                {...register(`answers.${index}.answer`)}
                                placeholder={`Answer ${index + 1}`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                ))}
                 {errors.answers && <p className="text-sm text-red-600 mt-1">{errors.answers.message || errors.answers.root?.message}</p>}
            </div>

            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                    {isPending ? "Saving..." : "Save Quiz"}
                </button>
            </div>
        </form>
    );
}