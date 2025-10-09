import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, TrendingUp, Target, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Campaign {
  id: string;
  platform: string;
  campaign_name: string;
  objective: string;
  budget_daily: number;
  status: string;
  performance_metrics: any;
  ai_insights: any;
  created_at: string;
}

export default function AIAdsManager() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [campaignsRes, insightsRes] = await Promise.all([
        supabase.from('ai_ad_campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('ai_audience_insights').select('*').order('last_analyzed_at', { ascending: false }).limit(5),
      ]);

      if (campaignsRes.error) throw campaignsRes.error;
      if (insightsRes.error) throw insightsRes.error;

      setCampaigns(campaignsRes.data || []);
      setInsights(insightsRes.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAICampaigns = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-campaign-manager', {
        body: { action: 'create_campaigns' },
      });

      if (error) throw error;

      toast({
        title: 'AI is creating campaigns!',
        description: 'The AI is analyzing your products and creating optimized campaigns.',
      });

      setTimeout(fetchData, 2000);
    } catch (error: any) {
      toast({
        title: 'Error creating campaigns',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const optimizeCampaigns = async () => {
    try {
      const { error } = await supabase.functions.invoke('ai-campaign-optimizer');
      if (error) throw error;

      toast({
        title: 'AI optimization started!',
        description: 'AI is analyzing and optimizing your campaigns.',
      });

      setTimeout(fetchData, 2000);
    } catch (error: any) {
      toast({
        title: 'Error optimizing campaigns',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              AI Ads Manager
            </h1>
            <p className="text-muted-foreground">
              Let AI handle your advertising across all platforms
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={optimizeCampaigns} variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Optimize All
            </Button>
            <Button onClick={createAICampaigns} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create AI Campaigns
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">
                  ${campaigns.reduce((acc, c) => acc + (c.budget_daily || 0), 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Insights</p>
                <p className="text-2xl font-bold">{insights.length}</p>
              </div>
              <Sparkles className="h-8 w-8 text-primary opacity-50" />
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Active Campaigns</h2>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No campaigns yet. Let AI create optimized campaigns for your products.
              </p>
              <Button onClick={createAICampaigns} disabled={creating}>
                <Sparkles className="h-4 w-4 mr-2" />
                Create AI Campaigns
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{campaign.campaign_name}</h3>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline">{campaign.platform}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Objective: {campaign.objective} • Budget: ${campaign.budget_daily}/day
                      </p>
                      {campaign.ai_insights?.recommendation && (
                        <div className="flex items-start gap-2 mt-2 p-3 bg-muted rounded-lg">
                          <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                          <p className="text-sm">{campaign.ai_insights.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">AI Audience Insights</h2>
          {insights.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              AI is collecting audience data. Check back soon!
            </p>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{insight.insight_type}</p>
                      {insight.ai_recommendations?.summary && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.ai_recommendations.summary}
                        </p>
                      )}
                      {insight.conversion_rate && (
                        <p className="text-sm mt-2">
                          Conversion Rate: {(insight.conversion_rate * 100).toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
