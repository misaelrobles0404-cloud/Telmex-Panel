import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './ui/Card';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export function MetricCard({ title, value, icon: Icon, trend, color = 'blue', subtitle }: MetricCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        red: 'bg-red-50 text-red-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                        <p className="text-3xl font-bold text-gray-900">{value}</p>
                        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}

                        {trend && (
                            <div className="mt-2 flex items-center gap-1">
                                <span className={`text-sm font-medium ${trend.isPositive ? 'text-success' : 'text-error'}`}>
                                    {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                                </span>
                                <span className="text-xs text-gray-500">vs semana pasada</span>
                            </div>
                        )}
                    </div>

                    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                        <Icon size={24} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
