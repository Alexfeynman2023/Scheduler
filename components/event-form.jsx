import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { eventSchema } from "@/app/lib/validators";
import { createEvent } from "@/actions/events";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/use-fetch";

const EventForm = ({ onSubmitForm, initialData = {} }) => {
  const router = useRouter();
  const [questions, setQuestions] = useState([""]);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData.title || "",
      description: initialData.description || "",
      duration: initialData.duration || 30,
      isPrivate: initialData.isPrivate ?? true,
    },
  });

  const { loading, error, fn: fnCreateEvent } = useFetch(createEvent);

  const onSubmit = async (data) => {
    // 过滤掉空问题
    const filteredQuestions = questions.map(q => q.trim()).filter(q => q.length > 0);
    await fnCreateEvent({ ...data, questions: filteredQuestions });
    if (!loading && !error) onSubmitForm();
    router.refresh(); // Refresh the page to show updated data
  };

  return (
    <form
      className="px-6 flex flex-col gap-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Event Title
        </label>

        <Input id="title" {...register("title")} className="mt-1" />

        {errors.title && (
          <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>

        <Textarea
          {...register("description")}
          id="description"
          className="mt-1"
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="duration"
          className="block text-sm font-medium text-gray-700"
        >
          Duration (minutes)
        </label>

        <Input
          id="duration"
          {...register("duration", {
            valueAsNumber: true,
          })}
          type="number"
          className="mt-1"
        />

        {errors.duration && (
          <p className="text-red-500 text-xs mt-1">{errors.duration.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="isPrivate"
          className="block text-sm font-medium text-gray-700"
        >
          Event Privacy
        </label>
        <Controller
          name="isPrivate"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={(value) => field.onChange(value === "true")}
              value={field.value ? "true" : "false"}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select privacy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Private</SelectItem>
                <SelectItem value="false">Public</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Custom Questions (optional)
        </label>
        {questions.map((q, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <Input
              value={q}
              onChange={e => {
                const newQuestions = [...questions];
                newQuestions[idx] = e.target.value;
                setQuestions(newQuestions);
              }}
              placeholder={`Question ${idx + 1}`}
            />
            <Button
              type="button"
              variant="destructive"
              onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
              disabled={questions.length === 1}
            >
              Delete
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setQuestions([...questions, ""])}
        >
          Add Question
        </Button>
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Create Event"}
      </Button>
    </form>
  );
};

export default EventForm;
