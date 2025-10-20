import React, { useState } from 'react';

interface EventFormProps {
	initial?: any;
	onSubmit: (data: any) => Promise<void>;
	submitting?: boolean;
}

const EventForm: React.FC<EventFormProps> = ({ initial = {}, onSubmit, submitting = false }) => {
	const [formData, setFormData] = useState({
		name: initial.name || '',
		subtitle: initial.subtitle || '',
		description: initial.description || '',
		location: initial.location || '',
		start_datetime: initial.start_datetime || '',
		end_datetime: initial.end_datetime || '',
		capacity: initial.capacity ? String(initial.capacity) : '',
		tags: initial.tags || [],
		allow_registration: initial.allow_registration ?? true
	});

	const [tagInput, setTagInput] = useState('');

	const addTag = () => {
		if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
			setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
			setTagInput('');
		}
	};

	const removeTag = (tag: string) => setFormData(prev => ({ ...prev, tags: prev.tags.filter((t: string) => t !== tag) }));

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onSubmit({
			...formData,
			capacity: formData.capacity ? parseInt(formData.capacity) : undefined
		});
	};

	return (
		<form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
			<div className="space-y-6">
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event Name *</label>
					<input required value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border rounded" />
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date & Time *</label>
					<input required type="datetime-local" value={formData.start_datetime} onChange={e => setFormData(prev => ({ ...prev, start_datetime: e.target.value }))} className="w-full px-3 py-2 border rounded" />
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date & Time *</label>
					<input required type="datetime-local" value={formData.end_datetime} onChange={e => setFormData(prev => ({ ...prev, end_datetime: e.target.value }))} className="w-full px-3 py-2 border rounded" />
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
					<textarea required rows={4} value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border rounded" />
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
					<input value={formData.location} onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))} className="w-full px-3 py-2 border rounded" />
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
					<div className="flex gap-2 mb-2">
						<input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())} className="flex-1 px-3 py-2 border rounded" />
						<button type="button" onClick={addTag} className="px-4 py-2 bg-primary-500 text-white rounded">Add</button>
					</div>
					<div className="flex flex-wrap gap-2">
						{formData.tags.map((tag: string) => (
							<span key={tag} className="px-3 py-1 bg-gray-100 rounded">{tag} <button type="button" onClick={() => removeTag(tag)} className="ml-2">x</button></span>
						))}
					</div>
				</div>

				<div className="flex items-center gap-4">
					<label className="flex items-center gap-2">
						<input type="checkbox" checked={formData.allow_registration} onChange={e => setFormData(prev => ({ ...prev, allow_registration: e.target.checked }))} />
						<span className="text-sm">Allow registration</span>
					</label>

					<label className="flex items-center gap-2">
						<input type="number" value={formData.capacity} onChange={e => setFormData(prev => ({ ...prev, capacity: e.target.value }))} placeholder="Capacity" className="w-32 px-2 py-1 border rounded" />
					</label>
				</div>
			</div>

			<div className="flex justify-end mt-6">
				<button type="submit" disabled={submitting} className="px-6 py-2 bg-primary-500 text-white rounded">{submitting ? 'Saving...' : 'Create Event'}</button>
			</div>
		</form>
	);
};

export default EventForm;
