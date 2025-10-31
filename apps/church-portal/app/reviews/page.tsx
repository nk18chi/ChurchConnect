"use client";

import { useState } from "react";
import { Star, MessageSquare, Flag } from "lucide-react";

// Mock data
const mockReviews = [
  {
    id: "1",
    userName: "John Doe",
    content:
      "Wonderful church community! Very welcoming and the teaching is excellent.",
    visitDate: "2024-10-20",
    status: "APPROVED",
    response: null,
  },
  {
    id: "2",
    userName: "Jane Smith",
    content: "Great Sunday service. The worship was uplifting and inspiring.",
    visitDate: "2024-10-15",
    status: "APPROVED",
    response: {
      content: "Thank you for visiting! We're so glad you enjoyed the service.",
      respondedBy: "Pastor John",
      createdAt: "2024-10-16",
    },
  },
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(mockReviews);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const handleRespond = (reviewId: string) => {
    if (!responseText.trim()) return;

    // TODO: Implement GraphQL mutation
    console.log("Responding to review:", reviewId, responseText);
    alert("Response submitted successfully!");
    setRespondingTo(null);
    setResponseText("");
  };

  const handleFlag = (reviewId: string) => {
    if (
      confirm(
        "Are you sure you want to flag this review for moderation? This will notify the admin team."
      )
    ) {
      // TODO: Implement GraphQL mutation
      console.log("Flagging review:", reviewId);
      alert("Review flagged for moderation.");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
        <p className="mt-1 text-gray-600">
          View and respond to visitor reviews
        </p>
      </div>

      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {review.userName}
                    </h3>
                    <span className="text-sm text-gray-500">
                      • {new Date(review.visitDate).toLocaleDateString()}
                    </span>
                    {review.status === "APPROVED" && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Approved
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-gray-700">{review.content}</p>

                  {review.response ? (
                    <div className="mt-4 rounded-lg bg-blue-50 p-4">
                      <div className="flex items-center gap-2 text-sm text-blue-900">
                        <MessageSquare className="h-4 w-4" />
                        <span className="font-medium">
                          Your Response by {review.response.respondedBy}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-blue-800">
                        {review.response.content}
                      </p>
                    </div>
                  ) : respondingTo === review.id ? (
                    <div className="mt-4">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Write your response..."
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleRespond(review.id)}
                          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                        >
                          Submit Response
                        </button>
                        <button
                          onClick={() => {
                            setRespondingTo(null);
                            setResponseText("");
                          }}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => setRespondingTo(review.id)}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Respond
                      </button>
                      <button
                        onClick={() => handleFlag(review.id)}
                        className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        <Flag className="h-4 w-4" />
                        Flag for Moderation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
            <Star className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No reviews yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Reviews from visitors will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
