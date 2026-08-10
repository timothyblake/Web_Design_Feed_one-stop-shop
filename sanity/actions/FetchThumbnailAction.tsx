import { useState } from 'react';
import { type DocumentActionComponent, useDocumentOperation } from 'sanity';

interface ThumbnailResponse {
  cdnUrl?: string;
  error?: string;
  details?: string[];
}

export const FetchThumbnailAction: DocumentActionComponent = (props) => {
  const [isUploading, setIsUploading] = useState(false);
  const { patch } = useDocumentOperation(props.id, props.type);
  const document = props.draft ?? props.published;
  const sourceImageUrl = document?.sourceImageUrl;
  const hasSourceImageUrl = typeof sourceImageUrl === 'string' && sourceImageUrl.trim().length > 0;

  return {
    label: isUploading ? 'Fetching thumbnail…' : 'Fetch thumbnail',
    disabled: isUploading || !hasSourceImageUrl,
    title: hasSourceImageUrl ? 'Copy the source image into R2 storage' : 'Add a source image URL first',
    onHandle: async () => {
      if (!hasSourceImageUrl) return;

      setIsUploading(true);
      try {
        const response = await fetch('/api/fetch-thumbnail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: sourceImageUrl }),
        });
        const data = (await response.json()) as ThumbnailResponse;

        if (!response.ok || !data.cdnUrl) {
          const detail = data.details?.filter(Boolean).join('; ');
          throw new Error(detail || data.error || `Upload failed (${response.status})`);
        }

        patch.execute([{ set: { thumbnailUrl: data.cdnUrl } }]);
      } catch (error) {
        window.alert(
          `Could not fetch thumbnail: ${error instanceof Error ? error.message : String(error)}`
        );
      } finally {
        setIsUploading(false);
      }
    },
  };
};
