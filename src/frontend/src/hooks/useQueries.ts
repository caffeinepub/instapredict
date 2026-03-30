import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export interface Prediction {
  id: string;
  hashtags: string[];
  contentType: string;
  timeOfUpload: string;
  followerCount: bigint;
  predictedLikes: bigint;
  paid: boolean;
  createdAt: bigint;
}

export function useGetPredictionHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<Prediction[]>({
    queryKey: ["predictionHistory"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getPredictionHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSavePrediction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      hashtags: string[];
      contentType: string;
      timeOfUpload: string;
      followerCount: number;
      predictedLikes: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (actor as any).savePrediction(
        params.id,
        params.hashtags,
        params.contentType,
        params.timeOfUpload,
        BigInt(params.followerCount),
        BigInt(params.predictedLikes),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictionHistory"] });
    },
  });
}

export function useCreateRazorpayOrder() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: { predId: string }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).createRazorpayOrder(params.predId);
      return typeof result === "string" ? result : JSON.stringify(result);
    },
  });
}

export function useVerifyRazorpayPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { paymentId: string; predId: string }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).verifyRazorpayPayment(
        params.paymentId,
        params.predId,
      ) as Promise<boolean>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictionHistory"] });
    },
  });
}

export function useUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      if (!actor) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}
