'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BranchOption } from '@/actions/owner-dashboard';
import { Building2 } from 'lucide-react';

interface BranchFilterSelectProps {
  branches: BranchOption[];
  currentBranchId?: string;
}

export default function BranchFilterSelect({ branches, currentBranchId }: BranchFilterSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleBranchChange = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'ALL') {
      params.delete('branchId');
    } else {
      params.set('branchId', value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const selectedValue = currentBranchId || 'ALL';

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-gray-500 hidden sm:block" />
      <Select value={selectedValue} onValueChange={handleBranchChange}>
        <SelectTrigger className="w-[220px] h-9 text-xs bg-white border-gray-200">
          <SelectValue placeholder="Todas as Filiais" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL" className="text-xs font-medium">
            🏢 Todas as Filiais (Consolidado)
          </SelectItem>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id} className="text-xs">
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
