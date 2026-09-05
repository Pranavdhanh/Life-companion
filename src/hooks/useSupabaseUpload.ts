import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useSupabaseUpload(bucketName: string) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    setIsUploading(true)
    setError(null)

    try {
      // Ensure unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${path}/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      return publicUrl
    } catch (err: any) {
      console.error('Error uploading file:', err)
      setError(err.message)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  return { uploadFile, isUploading, error }
}
