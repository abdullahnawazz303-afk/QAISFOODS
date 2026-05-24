import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  supabase,
  setFeaturedReview,
  unsetFeaturedReview,
  markReviewsApprovalColumnAvailable,
} from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Star, CheckCircle2, XCircle, Trash2 } from "lucide-react";

type Review = {
  id: string;
  author: string;
  role: string;
  text: string;
  created_at: string;
  is_allowed: boolean;
  featured_position?: number | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function ManageReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    // Fetch all reviews
    const { data: reviewData, error: reviewError } = await supabase
      .from("reviews")
      .select("id, author, role, text, created_at, is_allowed")
      .order("created_at", { ascending: false });

    if (reviewError) {
      toast.error("Failed to load reviews: " + reviewError.message);
      setLoading(false);
      return;
    }

    markReviewsApprovalColumnAvailable();

    // Fetch featured positions
    const { data: featuredData } = await supabase
      .from("featured_reviews")
      .select("review_id, position");

    const featuredMap: Record<string, number> = {};
    (featuredData ?? []).forEach((f: any) => {
      featuredMap[f.review_id] = f.position;
    });

    const merged: Review[] = (reviewData ?? []).map((r: any) => ({
      ...r,
      featured_position: featuredMap[r.id] ?? null,
    }));

    setReviews(merged);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const toggleAllowed = async (review: Review) => {
    setSaving(review.id);
    const { error } = await supabase
      .from("reviews")
      .update({ is_allowed: !review.is_allowed })
      .eq("id", review.id);
    if (error) {
      toast.error("Failed to update: " + error.message);
    } else {
      toast.success(review.is_allowed ? "Review hidden" : "Review approved & visible");
      setReviews(prev =>
        prev.map(r => r.id === review.id ? { ...r, is_allowed: !r.is_allowed } : r)
      );
    }
    setSaving(null);
  };

  const handleSetFeatured = async (reviewId: string, posStr: string) => {
    setSaving(reviewId);
    if (posStr === "none") {
      const { error } = await unsetFeaturedReview(reviewId);
      if (error) toast.error("Failed: " + error.message);
      else {
        toast.success("Removed from featured");
        setReviews(prev =>
          prev.map(r => r.id === reviewId ? { ...r, featured_position: null } : r)
        );
      }
    } else {
      const pos = parseInt(posStr);
      const { error } = await setFeaturedReview(reviewId, pos);
      if (error) toast.error("Failed: " + error.message);
      else {
        toast.success(`Set as featured position ${pos}`);
        // Clear any other review that had this position
        setReviews(prev =>
          prev.map(r => {
            if (r.id === reviewId) return { ...r, featured_position: pos };
            if (r.featured_position === pos) return { ...r, featured_position: null };
            return r;
          })
        );
      }
    }
    setSaving(null);
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setSaving(reviewId);
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    if (error) {
      toast.error("Delete failed: " + error.message);
    } else {
      toast.success("Review deleted");
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    }
    setSaving(null);
  };

  const pending  = reviews.filter(r => !r.is_allowed);
  const approved = reviews.filter(r => r.is_allowed);

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Manage Reviews</h1>
        <Link to="/" className="text-sm underline hover:text-primary">Back to Site</Link>
      </div>
      <div>
        <p className="text-muted-foreground text-sm mt-1">
          Approve customer reviews and select up to 3 featured reviews for the homepage.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading reviews…
        </div>
      ) : (
        <>
          {/* Pending approval */}
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <Badge variant="destructive">{pending.length}</Badge>
                Pending Approval
              </h2>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map(r => (
                      <TableRow key={r.id} className="bg-amber-50/40 dark:bg-amber-900/10">
                        <TableCell>
                          <p className="font-semibold text-sm">{r.author}</p>
                          {r.role && <p className="text-xs text-muted-foreground">{r.role}</p>}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-foreground line-clamp-3">{r.text}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(r.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                              disabled={saving === r.id}
                              onClick={() => toggleAllowed(r)}
                            >
                              {saving === r.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <CheckCircle2 className="h-3.5 w-3.5" />}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                              disabled={saving === r.id}
                              onClick={() => handleDelete(r.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          )}

          {/* Approved reviews */}
          <section className="space-y-3">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">{approved.length}</Badge>
              Approved Reviews
              <span className="text-xs font-normal text-muted-foreground ml-2">
                — select positions 1, 2, 3 to feature on homepage
              </span>
            </h2>
            {approved.length === 0 ? (
              <div className="border rounded-lg py-12 text-center text-muted-foreground text-sm">
                No approved reviews yet.
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approved.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <p className="font-semibold text-sm">{r.author}</p>
                          {r.role && <p className="text-xs text-muted-foreground">{r.role}</p>}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-foreground line-clamp-3">{r.text}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(r.created_at)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={r.featured_position ? String(r.featured_position) : "none"}
                            onValueChange={val => handleSetFeatured(r.id, val)}
                            disabled={saving === r.id}
                          >
                            <SelectTrigger className="h-8 w-28 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Not featured</SelectItem>
                              <SelectItem value="1">
                                <span className="flex items-center gap-1.5">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Position 1
                                </span>
                              </SelectItem>
                              <SelectItem value="2">
                                <span className="flex items-center gap-1.5">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Position 2
                                </span>
                              </SelectItem>
                              <SelectItem value="3">
                                <span className="flex items-center gap-1.5">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Position 3
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-1.5 text-xs"
                              disabled={saving === r.id}
                              onClick={() => toggleAllowed(r)}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Hide
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
                              disabled={saving === r.id}
                              onClick={() => handleDelete(r.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
