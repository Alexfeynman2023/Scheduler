import { getMeetingDetails } from '@/actions/meetings';
import { format } from 'date-fns';

export default async function MeetingDetailPage({ params }) {
    const meeting = await getMeetingDetails(params.meetingId);
    const { event, name, email, startTime, endTime, additionalInfo, meetLink, linkedinUrl, answers, augmentedNote, linkedinSummary } = meeting;

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow mt-8">
            <h1 className="text-2xl font-bold mb-4">Meeting Details</h1>
            <div className="mb-2"><b>Event:</b> {event.title}</div>
            <div className="mb-2"><b>Attendee Name:</b> {name}</div>
            <div className="mb-2"><b>Attendee Email:</b> {email}</div>
            <div className="mb-2"><b>Start:</b> {format(new Date(startTime), 'yyyy-MM-dd HH:mm')}</div>
            <div className="mb-2"><b>End:</b> {format(new Date(endTime), 'yyyy-MM-dd HH:mm')}</div>
            {meetLink && <div className="mb-2"><b>Meet Link:</b> <a href={meetLink} className="text-blue-600 underline" target="_blank">Join</a></div>}
            {linkedinUrl && <div className="mb-2"><b>LinkedIn:</b> <a href={linkedinUrl} className="text-blue-600 underline" target="_blank">{linkedinUrl}</a></div>}
            {additionalInfo && <div className="mb-2"><b>Additional Info:</b> {additionalInfo}</div>}
            {answers && Object.keys(answers).length > 0 && (
                <div className="mb-4">
                    <b>Custom Questions & Answers:</b>
                    <ul className="list-disc pl-5 mt-1">
                        {Object.entries(answers).map(([q, a], idx) => (
                            <li key={idx}><b>{q}</b>: {a}</li>
                        ))}
                    </ul>
                </div>
            )}
            {augmentedNote && (
                <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <h3 className="font-semibold text-yellow-800 mb-2">AI Generated Meeting Notes</h3>
                    <p className="text-gray-700">{augmentedNote}</p>
                </div>
            )}
            {linkedinSummary && (
                <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <h3 className="font-semibold text-blue-800 mb-2">AI Generated LinkedIn Summary</h3>
                    <p className="text-gray-700">{linkedinSummary}</p>
                </div>
            )}
        </div>
    );
} 