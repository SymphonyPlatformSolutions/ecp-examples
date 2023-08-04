import { Fragment, useEffect, useState } from "react";
import { AiOutlineShareAlt } from "react-icons/ai";
import { BsChatDotsFill } from "react-icons/bs";
import { researchData } from "../../Data/deals";
import "./CleverResearch.scss";

interface AppProps {
  ecpOrigin: string;
}

const CleverResearch = (props: AppProps) => {
  const [clientEcpId, setClientEcpId] = useState("");

  useEffect(() => {
    const roomId = researchData.coverageRoom[props.ecpOrigin];
    const container = document.querySelector(".coverage-ecp");
    if (container) {
      container.innerHTML = "";
      container.id = `coverage-ecp-${Date.now()}`;
      (window as any).symphony.openStream(roomId, `#${container.id}`);
    }

    openClientChat(
      researchData.customerRooms.map((c) => c.roomId[props.ecpOrigin])[0]
    );
  }, [props.ecpOrigin]);

  const openClientChat = (streamId: string) => {
    const container = document.querySelector(".client-ecp");
    if (container) {
      container.innerHTML = "";
      container.id = `client-ecp-${Date.now()}`;
      setClientEcpId(container.id);
      (window as any).symphony.openStream(streamId, `#${container.id}`);
    }
  };

  const blastReport = () => {
    const payload = {
      text: { "text/markdown": `Here's our latest research report on..` },
      entities: {
        report: {
          type: "fdc3.fileAttachment",
          data: {
            name: "ressearch-report.pdf",
            dataUri:
              "data:application/pdf;base64,JVBERi0xLjYKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nCXKMQqDUBBF0X5W8WqL8c3X8X8hWAjaCwNuIDFgIWjj9iOEC6e6VMMtJwgqU4H3rik7SmtaOsP1kbXC8T+erq+MId5pQc6PTY94o54NRsT2ojGxYUsfYpcpZJEFPy+nFUEKZW5kc3RyZWFtCmVuZG9iagoKMyAwIG9iago5OQplbmRvYmoKCjUgMCBvYmoKPDwvTGVuZ3RoIDYgMCBSL0ZpbHRlci9GbGF0ZURlY29kZS9MZW5ndGgxIDg1NzY+PgpzdHJlYW0KeJzlOG10E9eV982MZMk2lmRsYyLDPGdi82Fb8gdOgBo82JYw2ARj40QCgjWWZEvEllRJhkCT4NCkIQYKTWj6EXpCeprThIYyhuYgUgrs0u1pd5M2e5ru2T2hC9um3e1pgrNt0nN2G+y972nsGJLwY8/+25Hfe/f73nfvfY8Z0smRMOTDKIigBoe1xHyTJADA6wCkMLgzTQdiUgPC1wCE7w8kBoe/eXbbBwDSEYCcHwwO7R4Yb8rkA+S3AYgHI2EtNHKltQrA9ibauDuChOdunDAD2C2I3xUZTj+UIdslxKsRLxiKB7WnhffRn72J4cPaQ4mHpHoR8U7EaUwbDv/2jScQtA8B5O1MxFPpzfCFSQDnO4yfSIYT149+GAAoQ5umPUgj+GMPxkTMDBdEyQT/jx/T66bX4RGTB4ohwOebHmklFMEugKl3GTb17lRfFp68f/L+/8soLNnlB/AjOAHH4acIPWGw9sOj8CJcukn8IvwMvgcH4Tw8B4dg2WeaPYd2HubQUej7bO/kJYjDQ/Ad9PtFtPdD2E7GiAgBSMNjkEHfXdK4dHmyE/5ITsNlYoUvkCrhWYzhWXjb9M/Srz5h8Gl4CR7E+SzOzzGC8Cd4WlgNMeFF0QNP4Q4DAuvgy+j7XvgO2Qrb8YRFMQpAKHKTrUpxPTwJX0BoZDbHtO+jccib+gAjfgoOYyRR+DxshW6DfVrAUwKHRBl38314ldMOTOuaXxYTwnnBcuMb8BX8bcBfCELkMXgeXpqMTB6D54iHeODI5F+m/gB7TB5hA+RPXTd9/aM/Qww6oR+88B+fnU0jvtfB9tHCqT8Jf4UCqQRyJ3+JVTMecSvYb9yJ3fTQ1PuTgckelLFJJaYXTadNl2E39JkfkyJQJP0D77hfTu7FPb6NffEa5g3UtVu3+H29m3u6N3VtvHdDZ8f6de1rvZ621pY1avPqVU2fW7li+T13N9bVul011YsXVVbcpdxZLpcWOey2gjl5uVZLjtkkiQKBaqqTgEcXK6jDqykeRWuvqaae0khbTbVH8QZ0qlEdF6lSaW/nJEXTaYDqlbhos8gBXUXJgVsk1aykOiNJ7LQJmpgLhepvtCk0Q7Zs8iF8qE3xU/09Dm/gsFTJkTmIlJejBo+KRUs9undnZMwTwBjJeF5uq9Iazq2phvHcPATzENIXK4lxsng14YCw2LNyXADLHOYWd+rRQnrXJp+nzVle7q+pXqcXKG2cBa3cpG5u1XO4SRplocMBOl59aexgxg79gar8kBLStvl0UUPdMdEzNvak7qjSlyht+pI975TizsN6tdLm0auY1Y7uGT8dH7skuqnCrtCxDwG3o7z37s0UzaCYK+wfAgN1oVUn3b5y9ji9mOuxMa9CvWOBMS0zNdqvULsyNp6fP5bwYLqhy4cmMlOvHXDq3oN+3R6IkJV+Y+ve7g597qatPl2o8NKIhhT8a1bKlzvLHTMyXZ/FBkwLJgczXF7O0nAgo0I/IvroJl8Wp9DvPA2qu8qvCwHGuTTNKe5lnNFpzox6QMHadvT4xnSpYl1I8WDGD2j6aD921w5WGMWuF/zFWa6MFTroCrefy1KMal0oSnVTJSYJtWYrYN8wlTE7Rwr+kl3ec6KDSkchXaGgGWbHo3gCxt/OSCkaoJjo9qpsI2z26WobAqpmVMwzXutGDS2ABYu28WLqbiWhFyktM9VlYXmiPT6uYqjpRa06BIKGlu728HNFPWOBtmwIzJayyXcOGqaujS+jzjMNeJH725hwSSt2WaVnzBca0OWAM4TnboD6nOW66scK+xVf2M/aDjO05JqTN4ef98pmX0eP0rFpi2+5EUiWwcxJFZ5bzCg+Z9YMNqBuqbBQn+AU/ShoRwL1IqC0NOGs51RYcNgx4ZzKGrelifqIE6alMQx9CfWE2ww5ht9k1MTaqbV92pqZoWintd1Z7i/PPjXVArKp4Rg1LCyp7dMsvKaQYcH+bG3nJJbLUtb01KeEFb8Sobra5WN7Y+nhWTaSwXNu1GrzTdisZGGaoBzZ0whLpu6tcs5Orr6W4zNo+y3sddNsOmZROnrGmHHFMAgY+TodWAuryx1OfhewA63g3UvteKT5gR4bV1V2mCMrmRFlXWhM6fE1cWm8Tx5x7mG+CqGDdGxuqanGq61lXCH7N42rZH/PFt85O77z7d/sOy0QoTXQ4h+/C3m+cxT/0eBUgVEZkSGUIcxSNyIWLu88pwKMcq7ECRwPZghwmmWaRiCYEbI0e9ZRJXekgoAcKctRp6UlpFmytFFO4884sJSpuSbVolrVfGGO4BwnjHQaKa/hO6qVwJl8Moc4x1Grm5MzZHTcqjqzEqMooWYj3N/7seveLb4z+YBqfEZHLezBdimNYLHxnxUPDbFGedgfGQv42WGDEiwN/hGdKKuxTMpqDMScr+cq4RY9T2lh9GZGb87SzYyegy1KSgiqj2Ltu3TCOmCrrxyPJL3jZ84x+3usUn68VMbsv6vB4Pbiv/qPCdfxKyIHFqr5ZsgRQbRYTewl3P2G+w1HIVmxwtHgaKirbXCUO8RyR/leUXhsElWF6zcKheHJIvbiAC1TKelR04/hLqjG6+IldaCU1otSfvESSTKZagqtFktFYZmzxgmF0Hi3vLR4acpfN2fJnJSfLllSbC4rKy0uUemi9hK1cF57SUmxuT7fnJ/yg9VuVa1d1oDVxJbjVt36vtVktZqPmIjJJJpLobmhwf2AA8fnqxzQUNrc4K6qciDNUbjC3cBIbBibaGD7YFPhCse8BvyrqyVF5pxipfEu8Z6FZJ5jkUtoXHb3PY0NxYjluMgix0KRFDFOASHLGL6aSI++f210cov3xB3H9y986Vvr3v7H0df+vub7JaPDr3xzm+sj3b1l16P7hO/cE3rqyFHy8Ld/ZH3hhQLir3j0kRzyB8sSbf/2r343Z9++nK+8XL5jKGfyvqXt23YLrhUbGmTyLVP4xtKW+1Yok0usI+yLCN9EpVF898+BSrUwhxBJECxWkExSn98kkkJobp7eHN8W7sahOMoby4uFv7sw6ZGWSS//9X7p5WPHmK2NU+9KEdMWrM56dbHZdGfJgjL81CorMUk1rjvz54vzacC/YMF8SbT2+VVzl1kwm8W5mF33A1XAs+ooBMxhIZnHuyHbEaRIUihLXUP93Y3LXMIil4j5a6gvYclTaHHRQmHeQkmKTP75vybvWX+uTH/m+RfX7Hii7YWnupf++bdvXas+X3rkkcnfNW7d7Tmwp69tEUlmfk4GKh4beTjp9S1XHEtbemPrT/7wqF6eCP+qqaOOFirupu4Y2897mJtOzI0JZLUAX6lN5hz8MhD7/NhgzSxko+asbbFxi9+7KBw3ef56/zFgX8kgvc7zOgd61KV5gphPwGyyWCTIyRElyVaQQ4Q8oc+fn5e3xUI6LMRiNokSs1yP/fbAA0Zrlbqzua93NBSyEhSuWIF/dbXlYrmokAYrsRGEpNyxG2889WMy+S/kwxvH8j1fI784SR6d3Gfy/PcPpVcXvTXpJx/wjx32OTL/G66GiZ/02Zo+BDn77fXT1j3f/fjtHU/Z63jK2IeZMP2RxL4b8Ith1mfTLa/8RHoDz3kL9tNGljf+3AU/hw/INrKH/MTQMEMjiJwngB3csA2P9TnRgTTGXUhiM3bvm/FBwIYYMbRyIGzAItwBQwYsocyXDNiEGf+qAZuhAL5twDmwB3QDtkARWWrAViggqw04l6RIpwHnQZlwceZ/DFzC2wY8BxpFqwEXwB3iaha9ZEXsFdFnwASwJQ1YwG+gOw1YhGVSrQFLKBMyYBPcIe0zYDOUSccMOAc+kDIGbIHFplcM2AplprcMOFf4vel9A86D5ZZ/MuB82GYtMOA5sMO6w4ALYJn1rbboYDQd3RMO0ZCW1mgwntidjA5G0nRxcAmtr62rpWvj8cGhMG2NJxPxpJaOxmOu3NZbxeppN5po19LVdF0s6OqM9oezsnRDPBbvDg+ODGnJNalgOBYKJ2kNvUXgFvS+cDLF4HpXnWvZx7xbJKMp/DpLJ7VQeFhLPkjjAzfHQJPhwWgqHU4iMRqjva4eF+3S0uFYmmqxEN08o7hxYCAaDHNiMJxMaygcT0cwzB0jyWgqFA0ybynXTPSzMtGTDu8M0w1aOh1OxWMtWgp9YWSt8ZFUNBauprsi0WCE7tJSNBRORQdjyO7fTW/WosjVcDexWHwnGt2JasnwQDKcikRjgzSlxVI0FU5GBwwTNB3R0mzvw+F0MhrUhoZ2Y9WGE6jaj2XaFU1HmP9kFCO9N7zrhGs6GkzQAOaVRocTyfhOHmhNKpgMh2PoTwtp/dGhaBptRbSkFsS0Ye6iwRRPC2aDJrRYjWckGU+EMdj713Z+LIjhZVOaig/tDKe4dCwcDqVYSUK41SFUQsdD8fiDbEsD8SSGGUpHambFPRCPpVE1TrVQCPeOCYsHR4ZZsTDX6engtGAyjrzEkJZGK8MpVySdTqx0u3ft2uXSjPoEsTwutOy+HS+9OxE2SpJkVoaHOrEHYqx+I7zIbBM96zrpxgTmx4vBUUOgmk53Z52rznCBaYwm0ilXKjrkiicH3Ru9ndAGURjEkcaxB++qEFAcGuIaQkGIQwJ2Q5JLRZBKYTFSl+BaD7VQh4PCWpSKI38I9Sm0IpxELTZr3G4cYuCCXM65vbV6hLqNKNq5djVC61A/iBY6Ua8fubPtUtjA1zjXG4QRjEJDiTWQQp0wckJcg0INjttbuD33Ps5JzdDrMaI6HMs+Ve/2NqNoh/IMpzmHxTjM434QaXEYuG0eKMqFedVSyAlzLMStMtu9KNHDpbq4JstBmnuLcanNn+JxI3ocQP0gr+C0ZJDbZp2QtRxHOGJkcwdmOskjCHG96b2l0PMnc//pPdHDo9vJfW7gdIanOK8F8ZSxr2zOmI0Rnv8Y0lk+dmE0zHeEwxrPaYhbYP0VM7T7sePobX1RQ1czahPjldtpRLrT8MayPMDnFPcbQx8UYY3vmvJoWUYGbomC8qxpvAbZug8jN81lg0gfwt9u46wNY46yXvuN07SLn83IzP6ZVjan9+K6q/xOXumbc5PtoAGjX5lXZjfJ9/RxRmt4ldh+wjxKBmn87PejxhD3m40rwvtE41UOG1VP8+insxYydsl8JzilBjw8Wnbiw0Zm78ebovNTLWazN7tLWWWGeLypWbZjPNoQp8VnMs2khgxP2R0P8RvpwZkqDfDOy2YzxK3VfEa+B3hu0obXOI8ohL9s3bMdFkfdEV7F7MnK9nX6E5nTeH7jhl6C30xpI5ZhflIivA8TsBLfLd0YHfu5eDfOPj9B4/S4jJjd/2s9FleCZ3D2KUnOxDKMMXYa90Bs5vyNzDrJ05Xowduok98cCaN/vEbm6C0W2Nm59e6s43fnzbvIdmMU8TSPJ8Vz6eJ7GET+RvTQyd+j+TO5C2+yW9/q8VlTSXqAkA3QS7qN9T6yGYpAJr24yrhuhAZyL9I7cWX8VbCKNOHahPIrcf0c4mxtJMtOj8qwxkWWgR2HwIcLOQ3QTurxph3FmeDIUutQrxapNpwJjizVjVRcgeIcwIHfKDhTDlmJ6zSB3gypOb2KLdVnYEpOrHGQNjTAxmo00IoGWnBtMfBmxFerg71wg3zYtVj+k3ex/J/epfL73kb58PXnr5+6LsYnDk8IFyfI8QkiT/RNxCdEeFd9V8j9o3dK/vd3KuXfv7NK/t07C2XbO2TBb3/jlW2/IepvvCXyv13zyhev/eLa1Wuieq3hbu81b6l8nhTBavyw7iVz1fxVYu/VVb/u/ddVV3phTSEpwYjYKMbtncKZ4LaKoQuHgElAnDjUHnFK/jW50kuvdF0ZvaJfkWxXyJvFDXLf5fjlvZfFi39L/qarUk5cIPRC7YVLF8TEhdELgu28fF5wn28+Hz9/6vzV86ZzJytlmqnNdGUSmdGMKTN1SS3LzF3itZ8l9GzX2dGz+llp9FX9VcF2pvnMxBkxQ+aoVSfa5VH9iC7o+iX9TV10n2o+JRw/qZ8ULp1886TgfqX5FeH575FLJ948IayZQ2xQTwpwH4CzHQcl7GPERuxqMek6FjiWOCZ+49lK+eveSrn2a+rXBIzhzLMlZV4Wi/XZAof3haNN8vE1VuKBJuyxtcbqJR51cUj+qnNKth09dfTiUVE9uqDOqx4tceKUb/PannE/0/zM3mcmnjHZXiP5ECf5KhWePlQpf6VnSr56hNQeIfIR9xEhfmTvEQEO2w/TwyJzSg+Xlnnpl2u/LGw81HcofkisPUhsB+WD7oOietA+12u/SPJwF3lQi0OcukTyTs+j3nMMULvsRd4D+yrlp9Y3yfufXCU/+XiT/KX1U/LzTxD74/Tx2sfF2i+SvfuIus+a701hfeLYXDEcd5DS3vkNpb05DWKvGSsbQF4fjnNT10jOabnSywFVnlvm3b6lXd7mrZO34roF17n1hb0mIvZK9SJ2uuVVZ5NsE8k5Mp+Unm6U1Qwu8xZ7MyRXrUCD3V1OeWLT1CZB3dS43Ktuqljs/UUXudpJOr0L5A5vu9yVIU61n6zHeqzDwNpxrMVxykuueie8wqiXzCPFvSX1xb0OYuu119t6BTxpBM9XmTMky7ZmW59tr02y2dy2jba47bDtqm3KltOMtAmbGAe8JMjxEmIiGXJkfHNPVVVHJmequ0O3dm3VyX69oofN6qYtunm/Dr1btvrGCfmy/4lDh6BlQYde3+PTAwv8HXoIAZUBowjYF4yXQIs/lU6lR6qyDzHAFFRVpdO4coRzcEDV9EMYQqpS6XTKoKAGYumqET5XpVLTikwWAUA3aD6FlykqpatSBP8ZwgW1mFPUJmngaimcpl2ipe2pKtie4uh2VEELqWwsM7FtT2UjTU175E8pwP8AD8TAyQplbmRzdHJlYW0KZW5kb2JqCgo2IDAgb2JqCjUxNjEKZW5kb2JqCgo3IDAgb2JqCjw8L1R5cGUvRm9udERlc2NyaXB0b3IvRm9udE5hbWUvQkFBQUFBK0xpYmVyYXRpb25Nb25vCi9GbGFncyA1Ci9Gb250QkJveFstNDgxIC0zMDAgNzQyIDk4MV0vSXRhbGljQW5nbGUgMAovQXNjZW50IDgzMgovRGVzY2VudCAtMzAwCi9DYXBIZWlnaHQgOTgwCi9TdGVtViA4MAovRm9udEZpbGUyIDUgMCBSCj4+CmVuZG9iagoKOCAwIG9iago8PC9MZW5ndGggMjQzL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nF2Qz2qEMBDG73mKHLeHJerqTQLFsuChf6jtA8RkdAM1CTEefPtOxm0LPST8hpnvm48RXf/UO5vEW/R6gMQn60yE1W9RAx9hto6VFTdWp3tFv15UYAK1w74mWHo3+bZl4h17a4o7Pz0aP8IDE6/RQLRu5qfPbsB62EL4ggVc4gWTkhuY0OdZhRe1gCDVuTfYtmk/o+Rv4GMPwCuqyyOK9gbWoDRE5WZgbVFI3l6vkoEz/3rNoRgnfVMRJ0ucLIqqlsgVcUN8OfiSuSauu8zNwSV5313ylnyGn/RcbzFicroVRc5hrYPfcwYfsoreN6w/drAKZW5kc3RyZWFtCmVuZG9iagoKOSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UcnVlVHlwZS9CYXNlRm9udC9CQUFBQUErTGliZXJhdGlvbk1vbm8KL0ZpcnN0Q2hhciAwCi9MYXN0Q2hhciA1Ci9XaWR0aHNbMCA2MDAgNjAwIDYwMCA2MDAgNjAwIF0KL0ZvbnREZXNjcmlwdG9yIDcgMCBSCi9Ub1VuaWNvZGUgOCAwIFIKPj4KZW5kb2JqCgoxMCAwIG9iago8PC9GMSA5IDAgUgo+PgplbmRvYmoKCjExIDAgb2JqCjw8L0ZvbnQgMTAgMCBSCi9Qcm9jU2V0Wy9QREYvVGV4dF0KPj4KZW5kb2JqCgoxIDAgb2JqCjw8L1R5cGUvUGFnZS9QYXJlbnQgNCAwIFIvUmVzb3VyY2VzIDExIDAgUi9NZWRpYUJveFswIDAgNTk1LjMwMzkzNzAwNzg3NCA4NDEuODg5NzYzNzc5NTI4XS9Db250ZW50cyAyIDAgUj4+CmVuZG9iagoKNCAwIG9iago8PC9UeXBlL1BhZ2VzCi9SZXNvdXJjZXMgMTEgMCBSCi9NZWRpYUJveFsgMCAwIDU5NS4zMDM5MzcwMDc4NzQgODQxLjg4OTc2Mzc3OTUyOCBdCi9LaWRzWyAxIDAgUiBdCi9Db3VudCAxPj4KZW5kb2JqCgoxMiAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgNCAwIFIKL1BhZ2VNb2RlL1VzZU91dGxpbmVzCi9PcGVuQWN0aW9uWzEgMCBSIC9YWVogbnVsbCBudWxsIDBdCi9MYW5nKGVuLVVTKQo+PgplbmRvYmoKCjEzIDAgb2JqCjw8L0NyZWF0b3I8RkVGRjAwNTcwMDcyMDA2OTAwNzQwMDY1MDA3Mj4KL1Byb2R1Y2VyPEZFRkYwMDRDMDA2OTAwNjIwMDcyMDA2NTAwNEYwMDY2MDA2NjAwNjkwMDYzMDA2NTAwMjAwMDM3MDAyRTAwMzU+Ci9DcmVhdGlvbkRhdGUoRDoyMDIzMDcyODA4Mzc1NFonKT4+CmVuZG9iagoKeHJlZgowIDE0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwNjI0MiAwMDAwMCBuIAowMDAwMDAwMDE5IDAwMDAwIG4gCjAwMDAwMDAxODkgMDAwMDAgbiAKMDAwMDAwNjM2NiAwMDAwMCBuIAowMDAwMDAwMjA4IDAwMDAwIG4gCjAwMDAwMDU0NTMgMDAwMDAgbiAKMDAwMDAwNTQ3NCAwMDAwMCBuIAowMDAwMDA1NjY3IDAwMDAwIG4gCjAwMDAwMDU5NzkgMDAwMDAgbiAKMDAwMDAwNjE1NSAwMDAwMCBuIAowMDAwMDA2MTg3IDAwMDAwIG4gCjAwMDAwMDY0OTEgMDAwMDAgbiAKMDAwMDAwNjYxMCAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgMTQvUm9vdCAxMiAwIFIKL0luZm8gMTMgMCBSCi9JRCBbIDwyMTk1RTM2NUYwOTFERDZFMTlFQTg2RDlBQjE4N0E0NT4KPDIxOTVFMzY1RjA5MURENkUxOUVBODZEOUFCMTg3QTQ1PiBdCi9Eb2NDaGVja3N1bSAvQzBEOUNDRjc5MEZCMTk0RjMxQkE1QzFFQTU4MUE1OUQKPj4Kc3RhcnR4cmVmCjY3ODAKJSVFT0YK",
          },
        },
      },
    };
    (window as any).symphony.sendMessage(payload, {
      mode: "blast",
      streamIds: researchData.customerRooms.map(
        (c) => c.roomId[props.ecpOrigin]
      ),
      container: `#${clientEcpId}`,
    });
  };

  const getDate = (delta: number) => {
    const date = new Date(new Date().getTime() - delta);
    return date.toLocaleDateString("en", { month: "short", day: "numeric" });
  };

  return (
    <div className="research-root">
      <div className="research-modal">
        <div className="header">
          <div className="company-name">Tesla Inc</div>
          <div className="company-details">
            <div>Ticker</div>
            <div>TSLA US</div>
            <div>Sector</div>
            <div>Automotives</div>
            <div>Price</div>
            <div>265.28 (1.4%)</div>
            <div>Analyst</div>
            <div>Brian Jones</div>
          </div>
        </div>
        <div className="grid">
          <div className="research-list">
            <h3>Reports</h3>
            <div className="table">
              <div>Title</div>
              <div>Date</div>
              <div>Status</div>
              <div></div>
              <div>Why X is building revenue</div>
              <div>{getDate(100000000)}</div>
              <div>
                <span className="inactive badge">Draft</span>
              </div>
              <div></div>
              <div>Tesla, new entrants, new challenges</div>
              <div>{getDate(300000000)}</div>
              <div>
                <span className="active badge">Published</span>
              </div>
              <div>
                <AiOutlineShareAlt onClick={blastReport} />
              </div>
              <div>Batteries are the key for TSLA</div>
              <div>{getDate(500000000)}</div>
              <div>
                <span className="active badge">Published</span>
              </div>
              <div>
                <AiOutlineShareAlt onClick={blastReport} />
              </div>
            </div>
          </div>
          <div className="coverage-ecp"></div>
          <div className="client-list">
            <h3>Clients</h3>
            <div className="table">
              <div>Name</div>
              <div>Company</div>
              <div>Last</div>
              <div></div>
              {researchData.customerRooms.map((customer, index) => (
                <Fragment key={customer.name}>
                  <div>{customer.name}</div>
                  <div>{customer.company}</div>
                  <div>{getDate((index + 1) * 150000000)}</div>
                  <div
                    onClick={() =>
                      openClientChat(customer.roomId[props.ecpOrigin])
                    }
                  >
                    <BsChatDotsFill />
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
          <div className="client-ecp"></div>
        </div>
      </div>
    </div>
  );
};

export default CleverResearch;