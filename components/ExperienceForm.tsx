'use client';

import { useState } from 'react';
import { nanoid } from 'nanoid';
import { Experience } from '@/lib/types';

interface ExperienceFormProps {
  experiences: Experience[];
  onChange: (experiences: Experience[]) => void;
}

export default function ExperienceForm({ experiences, onChange }: ExperienceFormProps) {
  const addExperience = () => {
    const newExp: Experience = {
      id: nanoid(),
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      location: '',
      bullets: [''],
    };
    onChange([...experiences, newExp]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    onChange(
      experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    );
  };

  const removeExperience = (id: string) => {
    onChange(experiences.filter((exp) => exp.id !== id));
  };

  const addBullet = (expId: string) => {
    const exp = experiences.find((e) => e.id === expId);
    if (exp) {
      updateExperience(expId, 'bullets', [...exp.bullets, '']);
    }
  };

  const updateBullet = (expId: string, index: number, value: string) => {
    const exp = experiences.find((e) => e.id === expId);
    if (exp) {
      const newBullets = [...exp.bullets];
      newBullets[index] = value;
      updateExperience(expId, 'bullets', newBullets);
    }
  };

  const removeBullet = (expId: string, index: number) => {
    const exp = experiences.find((e) => e.id === expId);
    if (exp && exp.bullets.length > 1) {
      updateExperience(expId, 'bullets', exp.bullets.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">3. Work Experience</h2>
          <p className="text-sm text-gray-600 mt-1">
            Add your work history. Each role should have 2-3 bullet points with quantified achievements.
          </p>
        </div>
        <button
          onClick={addExperience}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          + Add Experience
        </button>
      </div>

      {experiences.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No work experience added yet.</p>
          <button
            onClick={addExperience}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Add your first experience →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {experiences.map((exp, index) => (
            <div key={exp.id} className="border border-gray-200 rounded-lg p-5 bg-gray-50">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Experience {index + 1}
                </h3>
                <button
                  onClick={() => removeExperience(exp.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={exp.role}
                    onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (MM/YYYY) *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                    placeholder="e.g., 01/2022"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date (MM/YYYY or &quot;Present&quot;) *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={exp.endDate}
                    onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                    placeholder="e.g., Present or 03/2024"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={exp.location}
                    onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Achievement Bullets (3 max, keep each to 2 lines)
                </label>
                {exp.bullets.map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="flex gap-2">
                    <textarea
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={2}
                      value={bullet}
                      onChange={(e) => updateBullet(exp.id, bulletIndex, e.target.value)}
                      placeholder="Action + technical detail + quantified impact. E.g., Optimized database queries, reducing API response time by 40%..."
                      required
                    />
                    {exp.bullets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBullet(exp.id, bulletIndex)}
                        className="text-red-600 hover:text-red-800 px-3 py-2 self-start"
                        title="Remove bullet"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {exp.bullets.length < 3 && (
                  <button
                    type="button"
                    onClick={() => addBullet(exp.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add another bullet
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}