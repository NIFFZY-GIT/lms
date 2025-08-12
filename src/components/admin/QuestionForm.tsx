'use client';

import { useForm, useFieldArray, Controller, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { Question } from '@/types';
import { useState } from 'react';
import Image from 'next/image';
import { toast } from '@/components/ui/toast';

export const questionSchema = z.object({
    // Use default to coerce undefined to empty string, then trim
    questionText: z.string().default('').transform(v => v.trim()),
    answers: z.array(z.object({
        id: z.string().optional(),
        answerText: z.string().min(1, 'Answer cannot be empty'),
        isCorrect: z.boolean(),
    })).length(4, "You must provide exactly 4 answers.").refine(
        (answers) => answers.filter(a => a.isCorrect).length === 1,
        { message: "Exactly one answer must be marked as correct." }
    ),
});
export type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
    onSubmit: (data: QuestionFormData) => void;
    initialData?: Question;
    isPending: boolean;
    onCancel: () => void;
}

export function QuestionForm({ onSubmit, initialData, isPending, onCancel }: QuestionFormProps) {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl || null);
    const { register, handleSubmit, control, setValue, getValues, formState: { errors } } = useForm<QuestionFormData>({
        // Cast resolver to match QuestionFormData (zod output)
        resolver: zodResolver(questionSchema) as unknown as Resolver<QuestionFormData>,
        defaultValues: initialData || {
            questionText: '',
            answers: [
                { answerText: '', isCorrect: true }, { answerText: '', isCorrect: false },
                { answerText: '', isCorrect: false }, { answerText: '', isCorrect: false },
            ]
        }
    });

    const { fields } = useFieldArray({ control, name: "answers" });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImageFile(file);
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const onLocalSubmit = (data: QuestionFormData) => {
        // Require either text or image
        const hasText = !!data.questionText && data.questionText.trim().length > 0;
    if (!hasText && !imageFile && !initialData?.imageUrl) { toast.warning('Please provide question text or upload an image.'); return; }
        // If we have an image, send multipart FormData; otherwise, JSON
        if (imageFile) {
            const form = new FormData();
            form.append('questionText', data.questionText || '');
            form.append('answers', JSON.stringify(data.answers));
            form.append('image', imageFile);
            onSubmit(form as unknown as QuestionFormData);
            return;
        }
        // Also support removing existing image
        if (!imageFile && previewUrl === null && initialData?.imageUrl) {
            const form = new FormData();
            form.append('questionText', data.questionText || '');
            form.append('answers', JSON.stringify(data.answers));
            form.append('removeImage', 'true');
            onSubmit(form as unknown as QuestionFormData);
            return;
        }
        onSubmit(data);
    };

    const onSubmitRHF: SubmitHandler<QuestionFormData> = (data) => onLocalSubmit(data);
    return (
        <form onSubmit={handleSubmit(onSubmitRHF)} className="space-y-6 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Input label="Question Text" registration={register('questionText')} error={errors.questionText?.message} />
                    <p className="text-xs text-gray-500 mt-1">Optional if you upload an image.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Image (optional)</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    {previewUrl && (
                        <div className="mt-2">
                            <div className="relative w-full max-w-md h-40">
                                <Image src={previewUrl} alt="Question preview" fill className="rounded-md border object-contain" unoptimized />
                            </div>
                            <button type="button" onClick={() => { setImageFile(null); setPreviewUrl(null); }} className="btn-ghost text-sm mt-2">Remove image</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Answers (select the correct one)</label>
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-3">
                        <Controller control={control} name={`answers.${index}.isCorrect`}
                            render={({ field: { value } }) => (
                                <input type="radio" name="correctAnswerRadio"
                                    onChange={() => {
                                        const currentAnswers = getValues('answers');
                                        const newAnswers = currentAnswers.map((ans, i) => ({ ...ans, isCorrect: i === index }));
                                        setValue('answers', newAnswers, { shouldValidate: true });
                                    }}
                                    checked={value} className="h-5 w-5 text-indigo-600"
                                />
                            )}
                        />
                        <div className="flex-grow">
                            <input {...register(`answers.${index}.answerText`)} placeholder={`Answer ${index + 1}`} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                    </div>
                ))}
                 {errors.answers && <p className="text-sm text-red-600 mt-1">{errors.answers.message || errors.answers.root?.message}</p>}
            </div>
            <div className="flex justify-end space-x-2"><button type="button" onClick={onCancel} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" disabled={isPending}>{isPending ? "Saving..." : "Save Question"}</button></div>
        </form>
    );
}