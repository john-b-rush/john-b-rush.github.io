---
title: "A Nap, a Walk, and a USB Stick"
description: "Codex fixed my freezing Wi-Fi during a nap, then migrated my router from pfSense to OPNsense during a walk with my daughter"
image: "/images/posts/nap-walk-usb-stick-header.jpg"
published: true
---

# A Nap, a Walk, and a USB Stick

<img srcset="../images/posts/nap-walk-usb-stick-header-300w.jpg 300w,
             ../images/posts/nap-walk-usb-stick-header-400w.jpg 400w,
             ../images/posts/nap-walk-usb-stick-header.jpg 600w"
     sizes="(max-width: 400px) 300px,
            (max-width: 600px) 400px,
            600px"
     src="../images/posts/nap-walk-usb-stick-header.jpg"
     alt="A painted still life of a router, Wi-Fi access point, iPad, USB stick, walking shoes, stroller, grocery bag, and baby blanket">

*Published: August 3, 2026*

We recently welcomed a new daughter to our family. During the late nights I've been streaming a few games on my iPad. Unfortunately, sometimes the stream would freeze and stutter. Something was up.

## Why Can’t You Just Do It?

After I put her down for a quick nap I asked Codex:

> Okay, I am trying to debug why my internet is so slow. Can you look at my network configuration? I have a pfSense router on 192.168.1.1, and I can give you the username/password for it (or you can get it from the 1Password CLI, item [REDACTED]). I also have a Wi-Fi router that I'm using, but I can also hook this computer up to Ethernet. I notice when I'm streaming a game on my iPad's Wi-Fi, I get lots of freezes and drops, whereas that didn't happen on a different network on vacation.

Codex started by mapping the interfaces and routes using `scutil --nwi`, `route -n get default`, `networksetup -listallhardwareports`, `ifconfig -a`, and `ipconfig`. It inspected the radio with `system_profiler SPAirPortDataType` and established baselines with `ping` and `traceroute`. Then Codex logged into pfSense via the HTTP admin console using a script that read the secret from 1Password CLI (Codex never read the password directly). It found both WAN and LAN are at 1 Gb/s full duplex with no errors or collisions.

Next it did some load testing using `ping -c 250 -i 0.1 192.168.1.1` and `networkQuality -v -s -I en1 -M 35`. On the AP's original channel it measured 59.9 Mb/s, 70.1 ms average AP latency, 12.8% packet loss, and 544 ms loaded responsiveness. Brutal.

It then located the Wi-Fi access point using pfSense's ARP and DHCP pages, along with the Mac's `arp` table. Codex fingerprinted the access point as a Ubiquiti via its ssh host key and as a UAP-AC-Pro using Ubiquiti's UDP discovery protocol. Impressive. Then it narrowed the tests just to the AP and found the packet loss was happening on the first hop, before pfSense or the Internet.

These are exactly the diagnostics I'd do myself, using the same tools. Well, I don't have to ssh fingerprint the access point. I can just look at it. But I'd have to spend a bunch of time looking up commands because I can never remember the exact incantations.

Codex suggested I try changing the AP to channel 44 at 40 MHz through the UniFi app. I made the change and had Codex retest: 32.9 Mb/s, 221 ms average AP latency, 13.3% packet loss, and 1,285 ms loaded responsiveness. Worse. I then gave it the 1Password item for the AP. It logged into the AP over ssh and saw thousands of retries and 14k transmission-queue drops. `ethtool` showed the AP's wired uplink was clean at 1 Gb/s full duplex.

That's when I realized my mistake. I need an _agent_ to do this work. I can't be fiddling with all this and taking care of a baby. This is a perfectly agent-shaped problem (action + verification).  So I asked Codex the most important question. "Why can't you just do it?"

Again Codex leapt into action. It ran another `system_profiler SPAirPortDataType` scan and found no nearby networks in the DFS block around channel 100. It then connected to the AP via ssh and made sure it supported channel 100. It then changed the AP's channel temporarily, tested, and got 144.9 Mb/s, 29.7 ms average AP latency, 2.5% packet loss, and 142 ms loaded responsiveness. That was 4.4x the throughput of channel 44 and roughly a 9x improvement in loaded responsiveness. Awesome.

Codex then persisted the change and verified the configuration. 

This is the same way I'd make the change too. Scan for open channels, test, verify. Very nice. And it all happened during a nap. 

## Great. What Else Should I Consider?

Naturally, I asked Codex the obvious next question about my home network: "Great. What else should I consider?" I know the pfSense router is hopelessly out of date. It's been ages and I've just never wanted to spend time on it. Instead, I decided to let Codex have a crack at it while we walked to PCC.

Codex first considered updating the AP's firmware based on the version it saw earlier. It did some research and decided not to install it because the fixes included in the update I didn't need and there were reports online about regressions on my legacy hardware, but it did find a more important issue.

My router was running pfSense 2.4.4-p3 and that is horrifically out of date. I've known this for a while and I thought, why not? Let's see how this goes. Codex and I chatted and we landed on a fresh install of OPNsense. I told Codex to figure out the install and all the configuration we needed. 

It did some archaeology on the old pfSense and found an old OpenVPN configuration, some unused VLANs and a broken `pfBlockerNG-devel` installation. I told Codex that we didn't need any of that anymore. Let's start fresh. Codex got to work downloading OPNsense, getting the configuration documented and backing up the old pfSense install.

Codex did a much more thorough job than I would have. I would have just popped in a USB installer and yoloed. Instead, Codex sshed into the pfSense box, created an encrypted backup, and inspected and validated the hardware to make sure the OPNsense installation goes swimmingly. It did suggest replacing the 9 year old SSD based on power-on hours, but I pushed back. Codex then automatically dug into the SMART data and things looked fine. I guess we can't quite setup the drinking bird to just press `y` yet lol. 

It got everything ready, but the actual install had to wait for us to finish the walk. Only I could plug in the USB stick and boot the router. But once that was done Codex could ssh in and finish the installation. It had me unplug the USB and reboot the router, and everything came right up. 

After that, Codex finished configuring firewalls, setting up and validating Quad9. It also did ad blocking with OISD via Unbound to replace my old and broken `pfBlockerNG-devel`. It also validated that was working and the list updates were coming in.

I asked Codex once more if there was anything else. It noticed that we were double NAT'd behind my C5500XK SmartNID. It backed up the configuration and put the SmartNID in Transparent Bridging with Tagged-201 mode. OPNsense had retained a stale private WAN lease so it reloaded WAN DHCP to get a new public lease and verified that the private 192.168.0.1 hop was gone. I was impressed that Codex fixed all that hands-off. 

Of course, I had to do the final test. That night I streamed games on the iPad without any issues.

None of this is particularly challenging. This is all stuff I've done before. What's exciting is how easy it is. I tell agents to fix stuff, grant permissions, add a little judgment, and plug in a USB stick. My home network gets upgraded while I spend time with my new daughter.
