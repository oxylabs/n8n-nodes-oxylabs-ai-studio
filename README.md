# n8n-nodes-oxylabs-ai-studio

This is an n8n community node. It lets you use Oxylabs Ai Studio Apps in your n8n workflows.


[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  <!-- delete if no auth needed -->  
[Compatibility](#compatibility)  
[Usage](#usage)  <!-- delete if not using this section -->  
[Resources](#resources)  
[Version history](#version-history)  <!-- delete if not using this section -->  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Credentials

Sign up and get API KEY from [here](https://aistudio.oxylabs.io/settings/api-key)

## Compatibility

node was tested against version `1.100.1`.

## Resources

The node includes four resources: Scraper, Crawler, Browser Agent, and Search. These correspond directly to the same applications available in Oxylabs AI Studio’s [web apps](https://aistudio.oxylabs.io/apps).

The parameters are nearly identical to those offered by the official SDKs ([Javscript](https://www.npmjs.com/package/oxylabs-ai-studio) and [Python](https://pypi.org/project/oxylabs-ai-studio/)).

An additional parameter not found in the web interface is `render_javascript`, which is especially useful for handling websites that rely on JavaScript for rendering content.


## Usage

- Scraper is useful for extracting information from a specific URL without getting blocked.

- Crawler is ideal for scanning an entire domain to collect URLs and their content in order to locate specific information.

- Search helps retrieve the latest information related to a particular query.

- Browser Agent controls a remote browser and can perform interactions, such as logging into an app and clicking buttons, making it valuable for scenarios that require user-like actions.



## Version history

- 0.1.0: First version released


