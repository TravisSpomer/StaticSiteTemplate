# Publish-Static-Website
# by Travis Spomer
#
# Publishes a static website to Azure Blob Storage.
# (Not needed for Azure Static Websites, since that already includes a deployment workflow.)
#
# Requirements:
# 1. A folder containing some static source files, with index.html at the root
# 2. An Azure Blob Storage account with the "Static website" feature enabled
# 3. An SAS URL generated from the Portal
#      (with at least read/write access to blobs, and a validity period long enough to copy files)
#
# How to use this in Azure DevOps Pipelines:
#
# 1. Use a Windows pipeline agent, as the AZCopy tool this script uses is only included on Windows
# 2. Create a pipeline variable called "sasurl" with your SAS URL, and mark it "secure" (the name isn't important)
# 3. Add this script as a task in your pipeline after the static files have been built: see the options below
# 
#   3A) Include this file in your repo
#   Then, add a new "PowerShell" task to your agent job, set Script Path to the path to this script,
#   and then set Arguments to:
#        build "$(sasurl)"
#   where "build" is the source folder and "sasurl" is your secure pipeline variable.
#  
#   3B) Include it as inline script
#   Add a new "PowerShell" task to your agent job, choose Inline, and then paste everything below the first "---"
#   into that box. Replace all tabs with spaces. Then, at the top, add the following:
#  
#   [string] $SourceFolder = "build" # or whatever is appropriate
#   [string] $BlobServiceSasUrl = "$(sasurl)" # the name of your secure pipeline variable
#
#   3C) Using YAML
#
#   - task: PowerShell@2
#     displayName: 'Deploy static website'
#     inputs:
#       targetType: filePath
#       filePath: ./Publish-Static-Website.ps1
#       arguments: 'build "$(sasurl)"'


param
(
	[Parameter(Position=0, Mandatory=$true, HelpMessage="Where are the static source files located?")]
	[string] $SourceFolder,
	[Parameter(Position=1, Mandatory=$true, HelpMessage="What's a valid blob service SAS URL?")]
	[string] $BlobServiceSasUrl
)


# ------------------------------------------------------------

if (!(Get-Command azcopy -errorAction SilentlyContinue))
{
	Write-Output "The AZCopy tool must be installed and on the PATH to use this script."
	return
}

if (![IO.File]::Exists([IO.Path]::Combine($SourceFolder, "index.html")))
{
	Write-Output "The folder '$SourceFolder' doesn't include an index.html. Supply the path to prebuilt static website files, not the root of a repo that generates them."
	return
}

if (!$BlobServiceSasUrl.Contains("/?"))
{
	Write-Output "The blob service SAS URL '$StorageAccountName' doesn't look valid. It should be a full URL with a query string. Generate one in the 'Shared access signature' section of the Azure Portal."
	return
}
[string] $DestUrl = $BlobServiceSasUrl.Replace("/?", "/`$web?")

# Okay, we're good! Let's start the copy.

Write-Output "------------------------------------------------------------"
Write-Output "First, upload the new files"
Write-Output "------------------------------------------------------------"

&azcopy sync $SourceFolder $DestUrl
if (!$?) { return }

Write-Output "------------------------------------------------------------"
Write-Output "Then, clean up the out-of-date files"
Write-Output "------------------------------------------------------------"

&azcopy sync $SourceFolder $DestUrl --delete-destination=true
if (!$?) { return }

Write-Output "------------------------------------------------------------"
Write-Output "Done! Deployment complete."
Write-Output "------------------------------------------------------------"
Write-Output ""
