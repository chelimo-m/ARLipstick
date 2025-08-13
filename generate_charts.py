#!/usr/bin/env python3
"""
Chart Generation Script for AR Lipstick Research Project
Generates charts and graphs for Chapter 3 documentation
"""

import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from pathlib import Path

# Set style for academic papers
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")

# Create output directory
output_dir = Path("docs/charts")
output_dir.mkdir(exist_ok=True)


def create_device_preference_pie_chart():
    """Create pie chart for user device preferences"""
    devices = ['Mobile', 'Desktop', 'Tablet']
    percentages = [65, 25, 10]
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1']
    
    fig, ax = plt.subplots(figsize=(10, 8))
    wedges, texts, autotexts = ax.pie(percentages, labels=devices, autopct='%1.1f%%',
                                     colors=colors, startangle=90)
    
    # Enhance text appearance
    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontweight('bold')
    
    ax.set_title('User Device Preferences for AR Try-On', fontsize=16, fontweight='bold', pad=20)
    plt.tight_layout()
    plt.savefig(output_dir / 'device_preferences_pie.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("✓ Device preferences pie chart saved")


def create_user_satisfaction_bar_chart():
    """Create bar chart for user satisfaction ratings"""
    categories = ['Ease of Use', 'Accuracy', 'Performance', 'User Interface', 'Overall Experience']
    ratings = [4.2, 3.8, 4.0, 4.5, 4.1]
    
    fig, ax = plt.subplots(figsize=(12, 8))
    bars = ax.bar(categories, ratings, color='#FF6B6B', alpha=0.8)
    
    # Add value labels on bars
    for bar, rating in zip(bars, ratings):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 0.05,
                f'{rating}', ha='center', va='bottom', fontweight='bold')
    
    ax.set_ylabel('Average Rating (1-5)', fontsize=12)
    ax.set_title('User Satisfaction Ratings by Category', fontsize=16, fontweight='bold')
    ax.set_ylim(0, 5)
    ax.grid(axis='y', alpha=0.3)
    
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(output_dir / 'user_satisfaction_bar.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("✓ User satisfaction bar chart saved")


def create_user_satisfaction_pie_chart():
    """Create pie chart for user satisfaction survey results"""
    categories = [
        'Very Satisfied (5/5)',
        'Satisfied (4/5)',
        'Neutral (3/5)',
        'Dissatisfied (2/5)',
        'Very Dissatisfied (1/5)'
    ]
    counts = [40, 35, 15, 7, 3]
    colors = [
        '#4CAF50',
        '#8BC34A',
        '#FFC107',
        '#FF9800',
        '#F44336'
    ]

    fig, ax = plt.subplots(figsize=(10, 8))
    wedges, texts, autotexts = ax.pie(
        counts,
        labels=categories,
        autopct='%1.1f%%',
        colors=colors,
        startangle=90
    )
    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontweight('bold')
    ax.set_title(
        'User Satisfaction Survey Results',
        fontsize=16,
        fontweight='bold',
        pad=20
    )
    plt.tight_layout()
    plt.savefig(
        output_dir / 'user_satisfaction_pie.png',
        dpi=300,
        bbox_inches='tight'
    )
    plt.close()
    print("✓ User satisfaction pie chart saved")


def create_usage_statistics_chart():
    """Create stacked bar chart for usage statistics"""
    categories = ['Daily', 'Weekly', 'Monthly', 'Occasionally']
    mobile = [45, 30, 15, 10]
    desktop = [20, 35, 25, 20]
    tablet = [15, 25, 30, 30]
    
    fig, ax = plt.subplots(figsize=(12, 8))
    
    x = np.arange(len(categories))
    width = 0.25
    
    ax.bar(x - width, mobile, width, label='Mobile', color='#FF6B6B', alpha=0.8)
    ax.bar(x, desktop, width, label='Desktop', color='#4ECDC4', alpha=0.8)
    ax.bar(x + width, tablet, width, label='Tablet', color='#45B7D1', alpha=0.8)
    
    ax.set_xlabel('Usage Frequency', fontsize=12)
    ax.set_ylabel('Percentage of Users (%)', fontsize=12)
    ax.set_title('AR Try-On Usage Statistics by Device Type', fontsize=16, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(categories)
    ax.legend()
    ax.grid(axis='y', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(output_dir / 'usage_statistics_stacked.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("✓ Usage statistics stacked bar chart saved")


def create_performance_metrics_line_chart():
    """Create line chart for performance metrics over time"""
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    accuracy = [75, 78, 82, 85, 87, 89]
    speed = [2.1, 1.9, 1.7, 1.5, 1.3, 1.2]
    user_satisfaction = [3.5, 3.7, 3.9, 4.1, 4.2, 4.3]
    
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10))
    
    # Accuracy chart
    ax1.plot(months, accuracy, marker='o', linewidth=3, markersize=8, 
             color='#FF6B6B', label='Accuracy (%)')
    ax1.set_ylabel('Accuracy (%)', fontsize=12)
    ax1.set_title('AR Try-On Accuracy Over Time', fontsize=14, fontweight='bold')
    ax1.grid(True, alpha=0.3)
    ax1.legend()
    
    # Speed and satisfaction chart
    ax2_twin = ax2.twinx()
    
    line1 = ax2.plot(months, speed, marker='s', linewidth=3, markersize=8,
                     color='#4ECDC4', label='Processing Time (s)')
    line2 = ax2_twin.plot(months, user_satisfaction, marker='^', linewidth=3, markersize=8,
                          color='#45B7D1', label='User Satisfaction')
    
    ax2.set_xlabel('Month', fontsize=12)
    ax2.set_ylabel('Processing Time (seconds)', fontsize=12, color='#4ECDC4')
    ax2_twin.set_ylabel('User Satisfaction (1-5)', fontsize=12, color='#45B7D1')
    ax2.set_title('Performance Metrics Over Time', fontsize=14, fontweight='bold')
    
    # Combine legends
    lines = line1 + line2
    labels = [l.get_label() for l in lines]
    ax2.legend(lines, labels, loc='upper right')
    
    ax2.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(output_dir / 'performance_metrics_line.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("✓ Performance metrics line chart saved")


def create_demographic_distribution_chart():
    """Create horizontal bar chart for demographic distribution"""
    age_groups = ['18-24', '25-34', '35-44', '45-54', '55+']
    percentages = [35, 40, 15, 7, 3]
    
    fig, ax = plt.subplots(figsize=(10, 8))
    bars = ax.barh(age_groups, percentages, color='#FF6B6B', alpha=0.8)
    
    # Add percentage labels
    for i, (bar, percentage) in enumerate(zip(bars, percentages)):
        width = bar.get_width()
        ax.text(width + 1, bar.get_y() + bar.get_height()/2,
                f'{percentage}%', ha='left', va='center', fontweight='bold')
    
    ax.set_xlabel('Percentage of Users (%)', fontsize=12)
    ax.set_title('User Age Distribution', fontsize=16, fontweight='bold')
    ax.grid(axis='x', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(output_dir / 'demographic_distribution.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("✓ Demographic distribution chart saved")


def create_system_performance_metrics_chart():
    """Create system performance metrics diagram for Figure 17"""
    # Define the metrics and their values
    metrics = {
        'AR Response Time': '< 100ms',
        'Page Load Time': '< 3 seconds',
        'Video Processing': '30fps',
        'Concurrent Users': '100+'
    }
    
    quality_indicators = {
        'Test Pass Rate': '100%',
        'Code Coverage': '75%',
        'User Satisfaction': '4.2/5',
        'Usability Score': '85%'
    }
    
    # Create figure with subplots
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
    
    # Performance Metrics (Left side)
    colors1 = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
    y_pos1 = np.arange(len(metrics))
    
    bars1 = ax1.barh(y_pos1, [1, 1, 1, 1], color=colors1, alpha=0.8, height=0.6)
    
    # Add metric labels and values
    for i, (metric, value) in enumerate(metrics.items()):
        ax1.text(0.5, i, f'{metric}\n{value}', ha='center', va='center', 
                fontweight='bold', fontsize=11, color='white')
    
    ax1.set_xlim(0, 1)
    ax1.set_ylim(-0.5, len(metrics) - 0.5)
    ax1.set_title('Performance Metrics', fontsize=14, fontweight='bold', pad=20)
    ax1.axis('off')
    
    # Quality Indicators (Right side)
    colors2 = ['#FF9F43', '#10AC84', '#5F27CD', '#00D2D3']
    y_pos2 = np.arange(len(quality_indicators))
    
    bars2 = ax2.barh(y_pos2, [1, 1, 1, 1], color=colors2, alpha=0.8, height=0.6)
    
    # Add indicator labels and values
    for i, (indicator, value) in enumerate(quality_indicators.items()):
        ax2.text(0.5, i, f'{indicator}\n{value}', ha='center', va='center', 
                fontweight='bold', fontsize=11, color='white')
    
    ax2.set_xlim(0, 1)
    ax2.set_ylim(-0.5, len(quality_indicators) - 0.5)
    ax2.set_title('Quality Indicators', fontsize=14, fontweight='bold', pad=20)
    ax2.axis('off')
    
    # Add connecting arrows
    for i in range(len(metrics)):
        ax1.annotate('', xy=(1.1, i), xytext=(0.9, i),
                    arrowprops=dict(arrowstyle='->', lw=2, color='#2C3E50'))
    
    for i in range(len(quality_indicators)):
        ax2.annotate('', xy=(1.1, i), xytext=(0.9, i),
                    arrowprops=dict(arrowstyle='->', lw=2, color='#2C3E50'))
    
    # Add main title
    fig.suptitle('System Performance Metrics Chart', fontsize=18, fontweight='bold', y=0.95)
    
    # Add subtitle
    fig.text(0.5, 0.88, 'Key Performance Indicators and Quality Metrics', 
             ha='center', fontsize=12, style='italic', color='#7F8C8D')
    
    plt.tight_layout()
    plt.subplots_adjust(top=0.85, bottom=0.1, left=0.05, right=0.95, wspace=0.3)
    plt.savefig(output_dir / 'system_performance_metrics.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("✓ System performance metrics chart saved")


def main():
    """Generate all charts for the research project"""
    print("Generating charts for AR Lipstick Research Project...")
    print("=" * 50)
    
    try:
        create_device_preference_pie_chart()
        create_user_satisfaction_bar_chart()
        create_user_satisfaction_pie_chart()
        create_usage_statistics_chart()
        create_performance_metrics_line_chart()
        create_demographic_distribution_chart()
        create_system_performance_metrics_chart()
        
        print("=" * 50)
        print("✓ All charts generated successfully!")
        print(f"Charts saved in: {output_dir.absolute()}")
        print("\nGenerated files:")
        for file in output_dir.glob("*.png"):
            print(f"  - {file.name}")
            
    except Exception as e:
        print(f"Error generating charts: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 