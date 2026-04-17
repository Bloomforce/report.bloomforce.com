'use client';

import { useState } from 'react';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { SalaryRangeChart } from '@/components/charts/SalaryRangeChart';
import { SalaryComparisonChart } from '@/components/charts/SalaryComparisonChart';
import { GatedContent } from '@/components/gate/GatedContent';
import { SECTION_IDS } from '@/lib/constants';
import { getAllRoles, getRoleById } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import { useGate } from '@/hooks/useGate';

export function SalaryExplorerSection() {
  const roles = getAllRoles();
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.roleId || '');
  const [selectedBreakdown, setSelectedBreakdown] = useState('');
  const { isUnlocked } = useGate();

  const role = getRoleById(selectedRoleId);
  if (!role) return null;

  const gatedBreakdowns = role.breakdowns.filter((b) => b.gated);
  const activeBreakdown = gatedBreakdowns.find((b) => b.categoryKey === selectedBreakdown) || gatedBreakdowns[0];

  return (
    <SectionWrapper id={SECTION_IDS.salaryExplorer} alt>
      <div className="text-center mb-10">
        <Badge className="mb-4">Salary Explorer</Badge>
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-navy mb-4">
          How does your salary compare?
        </h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          Select a role to see the full salary distribution. Unlock free access for detailed breakdowns by experience, location, and more.
        </p>
      </div>

      {/* Role selector */}
      <div className="max-w-xs mx-auto mb-8">
        <Select
          label="Select a Role"
          value={selectedRoleId}
          onChange={(e) => {
            setSelectedRoleId(e.target.value);
            setSelectedBreakdown('');
          }}
          options={roles.map((r) => ({ value: r.roleId, label: r.roleName }))}
        />
      </div>

      {/* Overall salary range - FREE */}
      <div className="bg-white rounded-2xl border border-ink/10 shadow-sm shadow-ink/[0.03] p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <h3 className="text-xl font-[family-name:var(--font-heading)] text-navy">
            {role.roleName}
          </h3>
          <div className="flex items-center gap-4 mt-2 md:mt-0">
            <div className="text-center">
              <span className="block text-xs text-text-muted">Median</span>
              <span className="text-lg font-semibold text-primary">{formatCurrency(role.overall.median)}</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-text-muted">Average</span>
              <span className="text-lg font-semibold text-navy">{formatCurrency(role.overall.average)}</span>
            </div>
          </div>
        </div>
        <SalaryRangeChart distribution={role.overall} />
      </div>

      {/* Detailed breakdowns - GATED */}
      {gatedBreakdowns.length > 0 && (
        <GatedContent message="Unlock salary breakdowns by experience, location, education, and more">
          <div className="bg-white rounded-2xl border border-ink/10 shadow-sm shadow-ink/[0.03] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <h3 className="text-lg font-[family-name:var(--font-heading)] text-navy mb-3 md:mb-0">
                Detailed Breakdown
              </h3>
              {isUnlocked && (
                <div className="flex flex-wrap gap-2">
                  {gatedBreakdowns.map((b) => (
                    <button
                      key={b.categoryKey}
                      onClick={() => setSelectedBreakdown(b.categoryKey)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        (activeBreakdown?.categoryKey === b.categoryKey)
                          ? 'bg-primary text-white'
                          : 'bg-bg-subtle text-text-muted hover:bg-primary-50 hover:text-primary'
                      }`}
                    >
                      {b.categoryName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {activeBreakdown && (
              <>
                <SalaryComparisonChart
                  entries={activeBreakdown.entries}
                  title={activeBreakdown.categoryName}
                />
                <div className="mt-6 space-y-3">
                  {activeBreakdown.entries.map((entry) => (
                    <SalaryRangeChart
                      key={entry.label}
                      distribution={entry.distribution}
                      label={entry.label}
                      compact
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </GatedContent>
      )}
    </SectionWrapper>
  );
}
