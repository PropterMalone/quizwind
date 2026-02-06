/**
 * Progress View - Progress dashboard component
 */

import { requireElement } from '../shell/dom';
import type { ProgressStats } from '../types';
import { Chart, ArcElement, Tooltip, Legend, ChartConfiguration } from 'chart.js';

// Register Chart.js components
Chart.register(ArcElement, Tooltip, Legend);

let chartInstance: Chart | null = null;

export function renderProgressStats(stats: ProgressStats): void {
  // Update stat cards
  requireElement('totalQuestionsCount').textContent = stats.totalQuestions.toString();
  requireElement('masteredCount').textContent = stats.masteredQuestions.toString();
  requireElement('learningCount').textContent = stats.learningQuestions.toString();
  requireElement('newCount').textContent = stats.newQuestions.toString();

  // Render chart
  renderChart(stats);
}

function renderChart(stats: ProgressStats): void {
  const canvas = requireElement<HTMLCanvasElement>('progressChart');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy();
  }

  const config: ChartConfiguration = {
    type: 'doughnut',
    data: {
      labels: ['Mastered', 'Learning', 'New'],
      datasets: [
        {
          data: [stats.masteredQuestions, stats.learningQuestions, stats.newQuestions],
          backgroundColor: ['#10b981', '#f59e0b', '#3b82f6'],
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = stats.totalQuestions;
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  };

  chartInstance = new Chart(ctx, config);
}

export function setupProgressView(onReset: () => void): () => void {
  const resetButton = requireElement<HTMLButtonElement>('resetProgressButton');

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      onReset();
    }
  };

  resetButton.addEventListener('click', handleReset);

  return () => {
    resetButton.removeEventListener('click', handleReset);
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  };
}
